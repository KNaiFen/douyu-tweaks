// ==UserScript==
// @name         改掉斗鱼各种烦人的地方
// @namespace    douyu-tweaks
// @version      0.3.0
// @license MIT
// @description  按需关闭斗鱼直播中的烦人功能，可在油猴菜单的“设置”中选择。
// @homepageURL  https://github.com/KNaiFen/douyu-tweaks
// @supportURL   https://github.com/KNaiFen/douyu-tweaks/issues
// @updateURL    https://raw.githubusercontent.com/KNaiFen/douyu-tweaks/main/douyu-tweaks.user.js
// @downloadURL  https://raw.githubusercontent.com/KNaiFen/douyu-tweaks/main/douyu-tweaks.user.js
// @match        https://www.douyu.com/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @sandbox      raw
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const pageWindow = unsafeWindow;
    const settingsKey = 'douyu-tweaks-settings';
    const features = [
        {
            id: 'removeDotaAssistant',
            label: '去掉斗鱼的刀塔助手',
            defaultEnabled: true,
            run: installDotaBlocker,
        },
        {
            id: 'followReplayAsOffline',
            label: '关注页轮播主播显示为未开播',
            defaultEnabled: true,
            run: installFollowReplayAsOffline,
        },
    ];
    let activeDialog;

    function readSettings() {
        const stored = GM_getValue(settingsKey, {});
        const settings = stored && typeof stored === 'object' && !Array.isArray(stored) ? { ...stored } : {};
        for (const feature of features) {
            if (typeof settings[feature.id] !== 'boolean') {
                settings[feature.id] = feature.defaultEnabled;
            }
        }
        return settings;
    }

    function openSettings() {
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', openSettings, { once: true });
            return;
        }
        if (activeDialog?.isConnected) {
            activeDialog.focus();
            return;
        }

        const previousFocus = document.activeElement;
        const host = document.createElement('div');
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                :host { all: initial; }
                * { box-sizing: border-box; letter-spacing: 0; }
                dialog {
                    width: min(480px, calc(100vw - 32px)); max-height: calc(100dvh - 32px);
                    padding: 0; margin: auto; border: 1px solid #cfd4d8; border-radius: 8px;
                    background: #fff; color: #22272b; color-scheme: light;
                    font: 14px/1.5 system-ui, sans-serif; overflow: auto;
                    box-shadow: 0 16px 48px #0003;
                }
                dialog::backdrop { background: #0006; }
                header { padding: 22px 24px 18px; border-bottom: 1px solid #e4e7e9; }
                h2 { margin: 0; font-size: 18px; line-height: 1.5; overflow-wrap: anywhere; }
                h3 { margin: 0 0 14px; font-size: 14px; color: #62696e; font-weight: 500; }
                .options { padding: 20px 24px; }
                label { display: flex; align-items: center; gap: 20px; min-height: 44px; cursor: pointer; }
                label + label { border-top: 1px solid #e4e7e9; margin-top: 12px; padding-top: 12px; }
                label span { flex: 1; min-width: 0; font-size: 15px; overflow-wrap: anywhere; }
                input { width: 20px; height: 20px; margin: 0; flex: 0 0 20px; accent-color: #16806a; cursor: pointer; }
                footer { padding: 16px 24px; border-top: 1px solid #e4e7e9; display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
                button { min-height: 40px; padding: 8px 16px; border: 1px solid #cfd4d8; border-radius: 5px; background: #fff; color: #22272b; font: inherit; cursor: pointer; }
                button:hover { background: #f0f3f4; }
                button[type="submit"] { background: #16806a; color: #fff; border-color: #16806a; }
                button[type="submit"]:hover { background: #116652; }
                button:disabled { opacity: .6; cursor: wait; }
                :focus-visible { outline: 2px solid #16806a; outline-offset: 3px; }
                .error { margin: 0; padding: 0 24px 16px; color: #b42332; overflow-wrap: anywhere; }
                .error:empty { display: none; }
            </style>
            <dialog aria-labelledby="settings-title" tabindex="-1">
                <form>
                    <header><h2 id="settings-title">改掉斗鱼各种烦人的地方</h2></header>
                    <div class="options"><h3>设置</h3><div id="features"></div></div>
                    <p class="error" role="alert"></p>
                    <footer><button type="button">取消</button><button type="submit">保存并刷新</button></footer>
                </form>
            </dialog>
        `;
        const dialog = shadow.querySelector('dialog');
        const form = shadow.querySelector('form');
        const error = shadow.querySelector('.error');
        const save = shadow.querySelector('[type="submit"]');
        const inputs = new Map();
        let saving = false;
        let settings;
        try {
            settings = readSettings();
        } catch {
            settings = {};
            error.textContent = '无法读取设置，请关闭后重试。';
            save.disabled = true;
        }
        for (const feature of features) {
            const label = document.createElement('label');
            const title = document.createElement('span');
            title.textContent = feature.label;
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = settings[feature.id] ?? feature.defaultEnabled;
            input.disabled = save.disabled;
            label.append(title, input);
            shadow.querySelector('#features').append(label);
            inputs.set(feature.id, input);
        }
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (saving || save.disabled) return;
            saving = true;
            save.disabled = true;
            error.textContent = '';
            try {
                const next = readSettings();
                for (const [id, input] of inputs) next[id] = input.checked;
                await GM_setValue(settingsKey, next);
                pageWindow.location.reload();
            } catch {
                error.textContent = '保存失败，请重试。';
                save.disabled = false;
                saving = false;
            }
        });
        shadow.querySelector('[type="button"]').addEventListener('click', () => {
            if (!saving) dialog.close();
        });
        dialog.addEventListener('cancel', (event) => {
            if (saving) event.preventDefault();
        });
        dialog.addEventListener('close', () => {
            host.remove();
            activeDialog = undefined;
            if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        }, { once: true });
        (document.fullscreenElement || document.body).append(host);
        activeDialog = dialog;
        dialog.showModal();
    }

    GM_registerMenuCommand('设置', openSettings);
    const settings = readSettings();
    for (const feature of features) {
        if (settings[feature.id]) feature.run();
    }

    function watchWebpackQueue(name, patchChunk) {
        const hookedQueues = new WeakSet();

        function hookQueue(queue) {
            if (!Array.isArray(queue) || hookedQueues.has(queue)) return;
            hookedQueues.add(queue);
            queue.forEach(patchChunk);

            function wrapPush(delegate) {
                // Capture each delegate separately: Webpack chains the previous push callback.
                return function (...chunks) {
                    chunks.forEach(patchChunk);
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

        let queue = pageWindow[name];
        hookQueue(queue);
        Object.defineProperty(pageWindow, name, {
            configurable: true,
            enumerable: true,
            get: () => queue,
            set(value) {
                queue = value;
                hookQueue(value);
            },
        });
    }

    function installFollowReplayAsOffline() {
        const patchedFactories = new WeakMap();
        const componentPath = '/followModule/components/DyCareCover/DyCareCover.js';

        watchWebpackQueue('shark_list_jsonp', (chunk) => {
            const modules = Array.isArray(chunk) && chunk[1];
            if (!modules || typeof modules !== 'object') return;

            for (const id of Object.keys(modules)) {
                const factory = modules[id];
                if (typeof factory !== 'function') continue;
                if (!patchedFactories.has(factory)) {
                    const source = Function.prototype.toString.call(factory);
                    let replacement = factory;
                    if (source.includes(componentPath) && source.includes('videoLoop') && source.includes('isLive')) {
                        replacement = function (module, exports, require) {
                            const result = Reflect.apply(factory, this, [module, exports, require]);
                            for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(exports))) {
                                if (typeof descriptor.value !== 'function' || !descriptor.writable) continue;
                                const component = descriptor.value;
                                Object.defineProperty(exports, key, {
                                    ...descriptor,
                                    value: function (props, ...args) {
                                        // Use Douyu's offline card, including its original showTime/notice and hover actions.
                                        const next = Number(props?.videoLoop) === 1
                                            ? { ...props, isLive: false, videoLoop: 0 }
                                            : props;
                                        return Reflect.apply(component, this, [next, ...args]);
                                    },
                                });
                            }
                            return result;
                        };
                    }
                    patchedFactories.set(factory, replacement);
                    patchedFactories.set(replacement, replacement);
                }
                modules[id] = patchedFactories.get(factory);
            }
        });
    }

    function installDotaBlocker() {
        const patchedFactories = new WeakMap();
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

        watchWebpackQueue('sharkLivePlayerJsonp', (chunk) => patchChunk(chunk, 'player'));
        watchWebpackQueue('shark_room_jsonp', (chunk) => patchChunk(chunk, 'room'));

        // A visual fallback for saved pages or changed bundles; normal loading never mounts the assistant.
        function addFallbackStyle() {
            if (!document.documentElement) return false;
            const style = document.createElement('style');
            style.id = 'douyu-tweaks-dota-style';
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
    }
})();
