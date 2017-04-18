/*eslint no-console: 0, no-eval: 0, no-useless-call: 0, no-loop-func: 0*/
var store = require('./store');
var merge = require('./merge');
var sha1 = require('./sha1');
var uuid = require('./uuid');

var loader = {};

loader.store = store;
loader.merge = merge;

/**
 * bizname 用来区分不用业务的存储空间
 * isStore 是否使用本地存储
 * clearStoreIfCantSave - setItem 遇到状况的时候是否清除当前 bizname 匹配的缓存（配有设置 prefix 的情况则不处理
 * useSign - 是否检查签名（如果配置 module 存在 sign)、是否在 store 时存入签名
 * serverUrl 增量代理服务器地址
 * cdnUrl cdn地址
 * hook - 钩子函数，用于调试、扩展、统计等，被传入的函数：
 *          - @param {string} stage enum: ['pre', 'post'] 运行前、运行后
 *          - @param {string} event enum: ['fetch', 'execute', 'native-invoke', 'sign', 'store:load', 'store.save']
 *          - @param {string} identity 一组 pre/post 有相同的 identity
 *          - @param {Object} options 当前运行时的附加结果，只有 stage: 'post' 的时候有值，否则是空对象
 *              - @if event @eq 'fetch'
 *                  - @param {string} mode enum: [undefined, 'full', 'patch', 'none'] 未知，全量拉取，增量拉取，无拉取
 *                  - @param {number} size 拉取的文本大小 (stage: 'post')
 *                  - @param {Object} module inc.add/inc.adds 设置的 module
 *              - @if event @in 'execute', 'native-invoke'
 *                  - @param {string} type enum: ['js', 'css']
 *                  - @param {Object} module inc.add/inc.adds 设置的 module
 *              - @if event @in 'sign', 'store:load', 'store.save'
 *                  - @param {number} size (stage: 'post')
 *              - @else: plain-object
 *          - @param {Object} configure inc 的 configure
 *          - @return {void} 
 */
var configure = { 
    bizname: '', 
    isStore: false, 
    clearStoreIfCantSave: true, 
    useSign: true,
    serverUrl: '', 
    cdnUrl: '',
    hook: null
};
var configureMaps = {
    bizname: function (name) {
        store.setPrefix(name + ':');
    },
    serverUrl: merge.setUrl,
    cdnUrl: merge.setCdnUrl
};


// 加载队列
var loadQueue = {};

var loaded = {};
var loading = {};
var afreshLoaded = {};
var modules = {};
var retries = {}

var extractModule = function (module) {
    const data = {}
    if (!module) return data
    if (module.url) data.url = module.url
    if (module.name) data.name = module.name
    if (module.version) data.version = module.version
    if (module.sign) data.sign = module.sign
    return data
}

var _dummyInokeHook = function () {
    return function () {}
};
var _realInokeHook = function (event) {
    var identity = uuid()
    configure.hook('pre', event, identity, {}, configure)
    return function (options) {
        if (options.hasOwnProperty('module')) {
            options.module = extractModule(options.module)
        }
        if (options.hasOwnProperty('content')) {
            options.size = typeof options.content === 'string' ? options.content.length : 0
            delete options.content
        }
        if (options.hasOwnProperty('mergeCode')) {
            options.type = options.mergeCode === 1
                ? 'full'
                : options.mergeCode === 2
                    ? 'patch'
                    : 'none'
            delete options.mergeCode
        }
        configure.hook('post', event, identity, options, configure)
    }
};
var invokeHook = _dummyInokeHook

// eval js
var globalEval = function (data) {
    if (data && /\S/.test(data)) {
        // (window.execScript || function(data) {
        window.eval.call(window, data);
        // })(data)
    }
};

// apply css
var globalApply = function (data) {
    var style = document.createElement('style');
    style.textContent = data;
    document.head.appendChild(style);
}

// script方式载入js
var scriptCall = function (url, callback) {
    var script = document.createElement('script');
    script.async = true;
    script.onload = callback;
    script.src = url;
    document.head.appendChild(script);
};

// 统一的执行js 方式
var jsCall = function (options) {
    var url = options.url
    var content = options.content
    var module = options.name
    var callback = options.callback

    setTimeout(function () {
        if (content) {
            modules[url] = content;
            var endHook = invokeHook('execute')
            globalEval(content, options);
            endHook({ type: 'js', module: options })
            callback();
            return
        }

        var data =  modules[url]
        if (data) {
            try {
                var endHook = invokeHook('execute')
                globalEval(modules[url], options);
                endHook({ type: 'js', module: options })
                callback();
            } catch (e) {
                store.removeItem(module);
                var endHook = invokeHook('native-invoke')
                scriptCall(url, function () {
                    endHook({ type: 'js', module: options }); 
                    if (callback) { callback(); }
                });
            }
        } else {
            store.removeItem(module);
            var endHook = invokeHook('native-invoke')
            scriptCall(url, function () {
                endHook({ type: 'js', module: options }); 
                if (callback) { callback(); }
            });
        }
    }, 0);
};

// link 方式加载 css
var linkCall = function (url, callback) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.onload = callback;
    document.head.appendChild(link);
};

// 统一的应用 css 方式
var cssCall = function (options) {
    var url = options.url
    var content = options.content
    var module = options.name
    var callback = options.callback

    setTimeout(function () {
        if (content) {
            modules[url] = content;
            var endHook = invokeHook('execute')
            globalApply(content);
            endHook({ type: 'css', module: options })
            callback();
            return
        }

        var data = modules[url];
        if (data) {
            var endHook = invokeHook('execute')
            globalApply(data);
            endHook({ type: 'css', module: options })
            callback();
        } else {
            store.removeItem(module);
            var endHook = invokeHook('native-invoke')
            linkCall(url, function () {
                endHook({ type: 'css', module: options }); 
                if (callback) { callback(); }
            });
        }
    })
};

// 自动判断文件类型加载资源
var assetCall = function (options) {
    var url = options.url
    var module = options.name
    var sign = options.sign
    var callback = options.callback

    var extname = (function (u) {
      var p = u.replace(/[#?].*$/, '').split('.')
      return p[p.length - 1]
    })(url)
    var handle = extname === 'js' ? jsCall : extname === 'css' ? cssCall : null

    if (configure.useSign && sign) {
        var endHook = invokeHook('fetch')
        merge.merge('', url, '', function (content) {
            endHook({ mode: 'full', content: content, module: options })
        
            if (isSignNotValid(sign, signContent(content))) {
                callback();
                return;
            }
            if (handle) handle({ url: url, name: module, sign: sign, callback: callback });
            else callback();
        });
    } else {
        if (handle) handle({ url: url, name: module, callback: callback });
        else callback();
    }

};

// 遍历出需要加载的 modules
var ergodicModules = function (scripts, assets, callback) {
    var length = assets.length;
    var hook = function () {
        if (!--length && callback) {
            callback(scripts);
        }
    };

    if (length === 0) {
        if (callback) {
            callback();
        }
        return;
    }

    for (var i = 0; i < assets.length; i++) {
        var moduleName = assets[i];
        var current = loadQueue[moduleName];

        if (typeof (module) !== 'function' && typeof (current) !== 'undefined') {
            if (current.rely && current.rely.length !== 0) {
                ergodicModules(scripts, current.rely, (function (_current) {
                    return function () {
                        scripts.push(moduleName);
                        hook();
                    };
                })(current));
            } else {
                scripts.push(moduleName);
                hook();
            }
        } else {
            hook();
        }
    }
};

// 对内容签名 （目前只支持 sha1
var signContent = function (content) {
    if (!content) return
    var endHook = invokeHook('sign')
    var sign = sha1(content)
    endHook({ content: content })
    return 'sha1:' + sign
};

// 检查是否签名无效 （目前只支持 sha1
var isSignNotValid = function (specifiedSign, calculatedSign) {
    return configure.useSign && specifiedSign && calculatedSign
        ? specifiedSign !== calculatedSign
        : false
};

// 加载资源
var loadAsset = function (options) {
    var url = options.url
    var module = options.name
    var version = options.version
    var callback = options.callback
    var specifiedSign = options.sign

    if (loading[url] && !afreshLoaded[url]) {
        if (callback) {
            setTimeout(function () {
                loadAsset(options);
            }, 5);
            return;
        }
        return;
    }

    if (loaded[url] && modules[url] && !afreshLoaded[url]) {
        if (callback) {
            callback(modules[url]);
            return;
        }
        return;
    }

    loading[url] = true;
    afreshLoaded[url] = false;

    // 是否使用本地存储，当 store.setItem 异常后会强制关闭这个开关所以每次有资源加载都检查
    if (configure.isStore) {
        var endHookStoreLoad = invokeHook('store:load')
        var moduleData = store.getItem(module) || {};
        endHookStoreLoad({ content: moduleData });
        var moduleContent = moduleData.c || '';
        var moduleURL = moduleData.u || '';

        if (moduleURL === url.replace(/[?#].*$/, '')) {
            loaded[url] = true;
            loading[url] = false;
            modules[url] = moduleContent;

            if (callback) {
                callback(moduleContent);
            }
            return;
        }

        var reload = function (allowRetries) {
            if (typeof retries[url] !== 'number') retries[url] = 0
            retries[url]++

            store.removeItem(module);

            if (retries[url] >= allowRetries) {
              // @TODO any report ?
              callback()
              return
            }

            afreshLoaded[url] = true;
            loadAsset(options);
        };

        var oldUrl = version ? moduleURL : '';
        
        var endFetchHook = invokeHook('fetch')
        merge.merge(oldUrl, url, moduleContent, function (content, code) {
            endFetchHook({ mergeCode: code, module: options })

            if (!content && oldUrl !== '') {
                reload(1);
                return;
            }

            var calculatedSign = signContent(content)
            if (isSignNotValid(specifiedSign, calculatedSign)) {
                reload(2);
                return
            }

            loaded[url] = true;
            loading[url] = false;
            modules[url] = content;

            if (content && version && url) {
                // When localStorage is full, or under Safari private mode ...
                var endHookStoreSave = invokeHook('store:save')
                var done = store.setItem(module, content, version, url, calculatedSign)
                endHookStoreSave({ content: content })
                if (!done) {
                    configure.isStore = false
                    if (configure.clearStoreIfCantSave) store.clear()
                    // @TODO any report?
                }
            }

            if (callback) {
                callback(content);
            }
            return;
        });
        return;
    }

    var endHook= invokeHook('fetch')
    merge.merge('', url, '', function (content) {
        endHook({ mode: 'full', module: options })

        if (isSignNotValid(specifiedSign, signContent(content))) {
            callback();
            return;
        }

        if (content) {
            loaded[url] = true;
            loading[url] = false;
            modules[url] = content;
            if (callback) {
                callback(content);
            }
        } else {
            afreshLoaded[url] = true;
            loadAsset(options);
        }
    });
};

// 加载资源文件
var loadAssets = function (assets, callback) {
    ergodicModules([], assets, function (scripts) {
        var length = scripts.length;
        var hook = function () {
            if (!--length && callback) {
                callback();
            }
        };

        if (length === 0) {
            if (callback) {
                callback();
            }
            return;
        }

        for (var i = 0; i < scripts.length; i++) {
            var moduleName = scripts[i];
            var current = loadQueue[moduleName];
            loadAsset({ url: current.path, name: moduleName, version: current.version, callback: hook, sign: current.sign  });
        }
    });
};


var loadParallel = function (assets, callback) {
    var length = assets.length;
    var hook = function () {
        if (!--length && callback) callback();
    };

    if (length === 0) {
        if (callback) {
            callback();
        }
        return;
    }

    for (var i = 0; i < assets.length; i++) {
        var module = assets[i];
        var current = loadQueue[module];
        if (typeof (module) === 'function') {
            assets[i]();
            hook();
            continue;
        }

        if (typeof (current) === 'undefined') {
            if (console && console.warn) {
                console.warn('In Error :: Module not found: ' + module);
            }
            hook();
            continue;
        }

        if (current.rely && current.rely.length !== 0) {
            loadParallel(current.rely, (function (_current) {
                return function () {
                    assetCall({ url: _current.path, name: module, sign: _current.sign, callback: hook });
                };
            })(current));
        } else {
            assetCall({ url: current.path, name: module, sign: current.sign, callback: hook });
        }
    }
};

var config = function (name, conf) {
    if (arguments.length === 0) {
        return configure;
    } else if (arguments.length === 1) {
        return configure[name];
    }

    configure[name] = conf;

    if (configureMaps[name]) {
        configureMaps[name](conf);
    }

    return conf;
};

var add = function (name, conf) {
    if (!name || !conf) {
        return;
    }

    loadQueue[name] = typeof conf === 'string' ? { path: conf } : conf;
};

var adds = function (conf) {
    if (!conf.modules) return;

    for (var module in conf.modules) {
        if (conf.modules.hasOwnProperty(module)) {
            var module_config = conf.modules[module];

            if (!conf.modules.hasOwnProperty(module)) continue;
            add(module, module_config);
        }
    }
};

var use = function () {
    var callback = function () {
        return;
    };
    var args = [].slice.call(arguments);

    if (typeof (args[args.length - 1]) === 'function') {
        callback = args.pop();
    }

    if (typeof configure.hook === 'function') {
        invokeHook = _realInokeHook
    }

    if (configure.isStore) {
        loadAssets(args, function () {
            loadParallel(args, callback);
        });
    } else {
        loadParallel(args, callback);
    }
};

var reset = function () {
    loadQueue = {};
    loaded = {};
    loading = {};
    afreshLoaded = {};
    modules = {};
    retries = {};
    invokeHook = _dummyInokeHook
}

loader.config = config;
loader.add = add;
loader.adds = adds;
loader.use = use;
loader.reset = reset;

module.exports = loader;
