!function(e){function n(r){if(t[r])return t[r].exports;var o=t[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,n),o.loaded=!0,o.exports}var t={};return n.m=e,n.c=t,n.p="",n(0)}([function(e,n,t){window.inc=t(1)},function(e,n,t){var r=t(2),o=t(3),u=t(4),i=t(5),c={};c.store=r,c.merge=o;var l={bizname:"",isStore:!1,clearStoreIfCantSave:!0,useSign:!0,serverUrl:"",cdnUrl:"",hook:null,count:null},a={bizname:function(e){r.setPrefix(e+":")},serverUrl:o.setUrl,cdnUrl:o.setCdnUrl},f={},s={},v={},d={},p={},m={},g=function(e){var n={};return e?(e.url&&(n.url=e.url),e.name&&(n.name=e.name),e.version&&(n.version=e.version),e.sign&&(n.sign=e.sign),n):n},S=function(){return function(){}},h=function(){},x=function(){},C={};C[o.RESULT_TYPE.FAILED]="error",C[o.RESULT_TYPE.SUCCESS_WITH_DIFF]="patch",C[o.RESULT_TYPE.SUCCESS_WITH_FULL_CONTENT]="full",C[o.RESULT_TYPE.SUCCESS_WITHOUT_DIFF]="none";var y=function(e){var n=i();return l.hook("pre",e||{},n,{},l),function(t){t.hasOwnProperty("module")&&(t.module=g(t.module)),t.hasOwnProperty("content")&&(t.size="string"==typeof t.content?t.content.length:0,delete t.content),t.hasOwnProperty("mergeCode")&&(t.type=C[t.mergeCode]||"unknown",delete t.mergeCode),l.hook("post",e||{},n,t,l)}},E=function(e){l.count(e,l)},T=function(e,n){l.catch(e,n,l)},I=S,_=h,U=x;r.invokeHook=function(){return I.apply(null,arguments)},r.invokeCount=function(){return _.apply(null,arguments)},r.reportError=function(){return U.apply(null,arguments)},o.invokeHook=function(){return I.apply(null,arguments)},o.invokeCount=function(){return _.apply(null,arguments)},o.reportError=function(){return U.apply(null,arguments)};var b=function(e){e&&/\S/.test(e)&&window.eval.call(window,e)},k=function(e){var n=document.createElement("style");n.textContent=e,document.head.appendChild(n)},w=function(e,n){var t=document.createElement("script");t.async=!0,t.onload=n,t.src=e,document.head.appendChild(t)},F=function(e){var n=e.url,t=e.content,o=e.name,u=e.callback;setTimeout(function(){if(t){p[n]=t;var i=I("execute");return b(t,e),i({type:"js",module:e}),void u()}var c=p[n];if(c)try{var i=I("execute");b(p[n],e),i({type:"js",module:e}),u()}catch(t){U(t,{url:n}),_("store:remove:bo-eval-illegal"),r.removeItem(o);var i=I("native-invoke");w(n,function(){i({type:"js",module:e}),u&&u()})}else{_("store:remove:bo-content"),r.removeItem(o);var i=I("native-invoke");w(n,function(){i({type:"js",module:e}),u&&u()})}},0)},L=function(e,n){var t=document.createElement("link");t.rel="stylesheet",t.type="text/css",t.href=e,t.onload=n,document.head.appendChild(t)},N=function(e){var n=e.url,t=e.content,o=e.name,u=e.callback;setTimeout(function(){if(t){p[n]=t;var i=I("execute");return k(t),i({type:"css",module:e}),void u()}var c=p[n];if(c){var i=I("execute");k(c),i({type:"css",module:e}),u()}else{_("store:remove:bo-content"),r.removeItem(o);var i=I("native-invoke");L(n,function(){i({type:"css",module:e}),u&&u()})}})},H=function(e){var n=e.url,t=e.name,r=e.sign,o=e.content||p[n],i=e.callback,c=function(e){var n=e.replace(/[#?].*$/,"").split(".");return n[n.length-1]}(n),l="js"===c?F:"css"===c?N:null;if(!l)return U(new Error("Illegal extname: "+c),{url:n}),void i();if(o)l({url:n,name:t,sign:r,content:o,callback:i});else{var a=I("fetch");_("full-fetch:bo-content"),u(n,function(o){return a({mode:"full",content:o,module:e}),P(r,D(o))?void i():void l({url:n,name:t,sign:r,content:o,callback:i})})}},O=function(n,t,r){var o=t.length,u=function(){!--o&&r&&r(n)};if(0===o)return void(r&&r());for(var i=0;i<t.length;i++){var c=t[i],l=f[c];"function"!=typeof e&&"undefined"!=typeof l?l.rely&&0!==l.rely.length?O(n,l.rely,function(e){return function(){n.push(c),u()}}(l)):(n.push(c),u()):u()}},W=function(e){var n,t,r=0;if(0===e.length)return r;for(n=0;n<e.length;n++)t=e.charCodeAt(n),r=(r<<5)-r+t,r|=0;return String(r)},D=function(e){if(e){var n=I("sign"),t=W(e);return n({content:e}),"hc1:"+t}},P=function(e,n){return!!(l.useSign&&e&&n)&&e!==n},j=function(e){var n=e.url,t=e.name,i=e.version,c=e.callback,a=e.sign;if(!v[n]||d[n])if(s[n]&&p[n]&&!d[n]){if(c)return void c(p[n])}else{if(v[n]=!0,d[n]=!1,l.isStore){var f=I("store:load"),g=r.getItem(t);f({content:g}),g||(g={},_("no-cache"));var S=g.c||"",h=g.u||"",x=g.v||"",C=g.s||"",y=h===n.replace(/[?#].*$/,"")||i&&a&&x===i&&C===a;if(y)return s[n]=!0,v[n]=!1,p[n]=S,void(c&&c(S));var E=function(o){return"number"!=typeof m[n]&&(m[n]=0),m[n]++,_("store:remove:bo-reload"),r.removeItem(t),m[n]>=o?(c(),void _("reload:exit-bo-ool")):(d[n]=!0,void j(e))},T=i?h:"";return void o.merge(T,n,S,function(e,o){if(!e&&""!==T)return E(1),U(new Error("Merge content got empty"),{code:o,source:T,target:n}),void _("reload:bo-content");var u=D(e);if(P(a,u))return E(1),U(new Error("Merge content sign not match; specified: "+a+" calculated: "+u),{code:o,source:T,target:n}),_("sign:invalid"),void _("reload:bo-sign");if(s[n]=!0,v[n]=!1,p[n]=e,e&&i&&n){var f=I("store:save"),d=r.setItem(t,e,i,n,u);f({content:e}),d||(_("store:save-failed:bo-illegal"),l.isStore=!1,l.clearStoreIfCantSave&&r.clear())}c&&c(e)})}var b=I("fetch");u(n,function(t){return b({mode:"full",module:e}),P(a,D(t))?(_("sign:invalid"),void c()):void(t?(s[n]=!0,v[n]=!1,p[n]=t,c&&c(t)):(d[n]=!0,j(e)))})}else if(c)return void setTimeout(function(){j(e)})},M=function(e,n){O([],e,function(e){var t=e.length,r=function(){!--t&&n&&n()};if(0===t)return void(n&&n());for(var o=0;o<e.length;o++){var u=e[o],i=f[u];j({url:i.path,name:u,version:i.version,callback:r,sign:i.sign})}})},R=function(e,n){var t=e.length,r=function(){!--t&&n&&n()};if(0===t)return void(n&&n());for(var o=0;o<e.length;o++){var u=e[o],i=f[u];"function"!=typeof u?"undefined"!=typeof i?i.rely&&0!==i.rely.length?R(i.rely,function(e){return function(){H({url:e.path,name:u,sign:e.sign,callback:r})}}(i)):H({url:i.path,name:u,sign:i.sign,callback:r}):(console&&console.warn&&console.warn("In Error :: Module not found: "+u),r()):(e[o](),r())}},$=function(e,n){return 0===arguments.length?l:1===arguments.length?l[e]:(l[e]=n,a[e]&&a[e](n),n)},Y=function(e,n){e&&n&&(f[e]="string"==typeof n?{path:n}:n)},A=function(e){if(e.modules)for(var n in e.modules)if(e.modules.hasOwnProperty(n)){var t=e.modules[n];if(!e.modules.hasOwnProperty(n))continue;Y(n,t)}},J=function(){var e=function(){},n=[].slice.call(arguments);"function"==typeof n[n.length-1]&&(e=n.pop()),"function"==typeof l.hook&&(I=y),"function"==typeof l.count&&(_=E),"function"==typeof l.catch&&(U=T),l.isStore?M(n,function(){R(n,e)}):R(n,e)},z=function(){f={},s={},v={},d={},p={},m={},I=S,_=h,U=x};c.config=$,c.add=Y,c.adds=A,c.use=J,c.reset=z,e.exports=c},function(e,n){function t(){if(e.exports.reportError)return e.exports.reportError.apply(null,arguments)}function r(e){p=e}function o(){return p}function u(e){if(!e)return!1;try{var n=d.getItem(p+e);return Boolean(n)}catch(e){return t(e),!1}}function i(e){if(!e)return null;try{var n=d.getItem(p+e);return n?JSON.parse(n):null}catch(e){return t(e),null}}function c(e,n,r,o,u){if(!(e&&n&&r&&o))return!1;try{var i={u:o.replace(/[?#].*$/,""),v:r,c:n};return u&&(i.s=u),d.setItem(p+e,JSON.stringify(i)),!0}catch(e){return t(e,{url:o,version:r,sign:u}),!1}}function l(e){if(!e)return!1;try{return d.removeItem(p+e),!0}catch(e){return t(e),!1}}function a(e){var n=i(e);return n?n.v:""}function f(e){var n=i(e);return n?n.c:""}function s(e){var n=i(e);return n?n.u:""}function v(){if(p)for(var e in d)0===e.indexOf(p)&&d.removeItem(e)}var d=window.localStorage,p="";e.exports={setPrefix:r,getPrefix:o,isExist:u,getItem:i,setItem:c,removeItem:l,getVersion:a,getContent:f,getUrl:s,clear:v}},function(e,n,t){function r(){return e.exports.invokeHook?e.exports.invokeHook.apply(null,arguments):function(){}}function o(){return e.exports.invokeCount?e.exports.invokeCount.apply(null,arguments):function(){}}function u(){if(e.exports.reportError)return e.exports.reportError.apply(null,arguments)}function i(e){p=e}function c(e){m=e}function l(e,n){for(var t=r("merge:calculation"),o="",u=n,i=null,c=0;c<u.length;c++){var l=u[c];if("object"==typeof l){var a=l[0]-1,f=l[1];i&&(a+=i[0]),i=l,o+=e.substring(a,a+f)}else o+=l}return t({}),o}function a(e,n){return m+e.replace(/(http:|https:|\/)/g,"").replace(/[?#].*$/,"")+"-"+n.replace(/(http:|https:|\/)/g,"").replace(/[?#].*$/,"")}function f(e,n){return p+"?target="+e.replace(/[?#].*$/,"")+"&source="+n.replace(/[?#].*$/,"")}function s(e,n,t){var o=r("merge:pull-diff"),i=a(n,e);d(i,function(c){if(c){var l=c[c.length-1];o({mergeCode:l}),t(Number(l)===S.SUCCESS_WITH_DIFF||Number(l)===S.SUCCESS_WITH_FULL_CONTENT?{code:Number(l),data:c.substr(0,c.length-1)}:{code:Number(l)})}else{o({mergeCode:-1}),u(new Error("Diff patch not found"),{source:e,target:n,url:i}),o=r("merge:request-diff");var a=f(n,e);d(a,function(r,i){if(/application\/json/i.test(i.getResponseHeader("Content-Type"))){var c=JSON.parse(r),l=Number(c.code),f=c.data;o({mergeCode:l}),t({code:l,data:f})}else u(new Error("Diff server did not response valid content with status: "+i.status),{body:r,source:e,target:n,url:a}),o({mergeCode:-1}),t({code:S.FAILED})})}})}function v(e,n,t,r){if(p&&m||(u(new Error("Server url not set")),console&&console.error&&console.error("In Error :: Server url not set")),!e)return void d(n,function(e){r(e,S.SUCCESS_WITH_FULL_CONTENT)});try{s(e,n,function(i){var c=i.code,a=i.data;o("merge:code:"+c),c===S.SUCCESS_WITH_DIFF?a.length>g?(o("merge:diff-fat"),d(n,function(e){r(e,S.SUCCESS_WITH_FULL_CONTENT)})):(o("merge:diff-thin"),r(l(t,JSON.parse(a)),c)):c===S.SUCCESS_WITH_FULL_CONTENT?r(a,c):c===S.SUCCESS_WITHOUT_DIFF?r(t,c):(u(new Error("Illegal merge result code:"+c+"  [fallback to full-fetch]"),{source:e,target:n}),d(n,function(e){r(e,S.SUCCESS_WITH_FULL_CONTENT)}))})}catch(t){u(t,{source:e,target:n}),d(n,function(e){r(e,S.SUCCESS_WITH_FULL_CONTENT)})}}var d=t(4),p="",m="",g=65536,S={FAILED:0,SUCCESS_WITH_DIFF:1,SUCCESS_WITH_FULL_CONTENT:2,SUCCESS_WITHOUT_DIFF:3};e.exports={_merge:l,_getMixDiff:s,setUrl:i,setCdnUrl:c,merge:v,RESULT_TYPE:S}},function(e,n){e.exports=function(e,n){var t=new window.XMLHttpRequest;return t.open("GET",e,!0),t.onreadystatechange=function(){4===t.readyState&&(200===t.status?n(t.responseText,t):n(null,t))},t.send(null)}},function(e,n){e.exports=function(){var e=(new Date).getTime(),n="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(n){var t=(e+16*Math.random())%16|0;return e=Math.floor(e/16),("x"==n?t:3&t|8).toString(16)});return n}}]);