// ==UserScript==
// @name         去掉斗鱼的刀塔助手
// @namespace    douyu-dota-assistant-blocker
// @version      0.1.2
// @description  阻止斗鱼刀塔助手启动，移除英雄、技能和装备悬停层及助手入口。
// @homepageURL  https://github.com/KNaiFen/douyu-dota-assistant-blocker
// @supportURL   https://github.com/KNaiFen/douyu-dota-assistant-blocker/issues
// @updateURL    https://raw.githubusercontent.com/KNaiFen/douyu-dota-assistant-blocker/main/douyu-dota-assistant-blocker.user.js
// @downloadURL  https://raw.githubusercontent.com/KNaiFen/douyu-dota-assistant-blocker/main/douyu-dota-assistant-blocker.user.js
// @match        https://www.douyu.com/*
// @run-at       document-start
// @grant        none
// @sandbox      raw
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const patchedFactories = new WeakMap();
    const hookedQueues = new WeakSet();
    const patchedRegistries = new WeakSet();
    const registryGetters = new WeakMap();
    const functionSource = Function.prototype.toString;

    function patchRegistry(registry) {
        if (!registry || typeof registry.registerModule !== 'function'
            || typeof registry.getModule !== 'function' || patchedRegistries.has(registry)) {
            return;
        }

        const registerModule = registry.registerModule;
        registry.registerModule = function (...modules) {
            return Reflect.apply(registerModule, this,
                modules.filter((module) => module?.id !== 'gameHotArea'));
        };
        patchedRegistries.add(registry);
    }

    function wrapRegistryGetter(getter) {
        if (!registryGetters.has(getter)) {
            registryGetters.set(getter, function (...args) {
                const result = Reflect.apply(getter, this, args);
                patchRegistry(result);
                return result;
            });
        }
        return registryGetters.get(getter);
    }

    function wrapPlayerCore(factory) {
        return function (module, exports, require) {
            // Webpack exports are non-configurable getters. Intercept their definition
            // so the registry is patched before the lazy player modules register.
            const hookedRequire = new Proxy(require, {
                get(target, property, receiver) {
                    if (property !== 'd') {
                        return Reflect.get(target, property, receiver);
                    }
                    return function (targetExports, name, getter) {
                        return target.d(targetExports, name, function () {
                            const value = getter();
                            // Discover the registry accessor without relying on its minified name.
                            if (targetExports === exports && typeof value === 'function'
                                && /^function\s*[^()]*\(\)\s*\{\s*return\s+\w+\s*;?\s*\}$/.test(functionSource.call(value))) {
                                return wrapRegistryGetter(value);
                            }
                            return value;
                        });
                    };
                },
            });
            return Reflect.apply(factory, this, [module, exports, hookedRequire]);
        };
    }

    function emptyComponent(module, exports, require) {
        require.r(exports);
        exports.default = function DisabledDotaAssistant() {
            return null;
        };
    }

    function patchChunk(chunk, kind) {
        const modules = Array.isArray(chunk) && chunk[1];
        if (!modules || typeof modules !== 'object') return;

        for (const id of Object.keys(modules)) {
            const factory = modules[id];
            if (typeof factory !== 'function') continue;
            if (patchedFactories.has(factory)) {
                modules[id] = patchedFactories.get(factory);
                continue;
            }
            const source = functionSource.call(factory);
            let replacement;

            if (kind === 'player' && source.includes('/@core/core/Module.js')
                && source.includes('registerModule') && source.includes('getModule')) {
                replacement = wrapPlayerCore(factory);
            } else if (kind === 'room'
                && (source.includes('/InteractCheck/Dota2NewEntranceCheck.jsx')
                    || source.includes('/Dota2TipsDialog/Dota2TipsDialog.js'))) {
                // Skip the toolbar's status request, socket subscription and reminder timers too.
                replacement = emptyComponent;
            }

            patchedFactories.set(factory, replacement || factory);
            if (replacement) {
                patchedFactories.set(replacement, replacement);
                modules[id] = replacement;
            }
        }
    }

    function hookQueue(queue, kind) {
        if (!Array.isArray(queue) || hookedQueues.has(queue)) return;
        hookedQueues.add(queue);
        queue.forEach((chunk) => patchChunk(chunk, kind));

        function wrapPush(delegate) {
            // Capture each delegate separately: Webpack chains the previous push callback.
            return function (...chunks) {
                chunks.forEach((chunk) => patchChunk(chunk, kind));
                return Reflect.apply(delegate, this, chunks);
            };
        }

        let push = wrapPush(queue.push);
        Object.defineProperty(queue, 'push', {
            configurable: true,
            get: () => push,
            set: (delegate) => { push = wrapPush(delegate); },
        });
    }

    function watchQueue(name, kind) {
        let queue = window[name];
        hookQueue(queue, kind);
        Object.defineProperty(window, name, {
            configurable: true,
            enumerable: true,
            get: () => queue,
            set(value) {
                queue = value;
                hookQueue(value, kind);
            },
        });
    }

    watchQueue('sharkLivePlayerJsonp', 'player');
    watchQueue('shark_room_jsonp', 'room');

    // A visual fallback for saved pages or changed bundles; normal loading never mounts the assistant.
    function addFallbackStyle() {
        if (!document.documentElement) return false;
        const style = document.createElement('style');
        style.id = 'douyu-dota-assistant-blocker-style';
        style.textContent = `
            .tooltips-385829,
            [class^="tooltips-"]:has([class*="herosTooltips-"]),
            [class*=" tooltips-"]:has([class*="herosTooltips-"]),
            .Dota2TipsDialog,
            [dataid="Dota2NewEntrance"] {
                display: none !important;
                pointer-events: none !important;
            }
        `;
        document.documentElement.appendChild(style);
        return true;
    }

    if (!addFallbackStyle()) {
        const observer = new MutationObserver(() => {
            if (addFallbackStyle()) observer.disconnect();
        });
        observer.observe(document, { childList: true });
    }
})();
