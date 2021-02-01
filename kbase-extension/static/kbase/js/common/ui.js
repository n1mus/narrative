define([
    // please use jquery with discretion.
    'jquery',
    'bluebird',
    'common/html',
    'base/js/namespace',
    './runtime',
    'google-code-prettify/prettify',
    'css!google-code-prettify/prettify.css',
    'bootstrap',
], ($, Promise, html, Jupyter, Runtime, PR) => {
    'use strict';
    const t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span'),
        ol = t('ol'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        button = t('button'),
        pre = t('pre'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        i = t('i');

    // "static" methods
    function na() {
        return span({ style: { fontStyle: 'italic', color: 'orange' } }, 'NA');
    }

    function htmlEncode(str) {
        return str
            .replace(/&/, '&amp;')
            .replace(/'/, '&#039;')
            .replace(/"/, '&quot;')
            .replace(/</, '&lt;')
            .replace(/>/, '&gt;');
    }

    /**
     * Make a static (non-collapsing) bootstrap panel with default styling
     * @param {string} title - panel title
     * @param {string} elementName - name for the data element in the panel body
     *
     * @returns {string} HTML string to create the panel
     */
    function makePanel(title, elementName) {
        return div({ class: 'panel panel-primary' }, [
            div({ class: 'panel-heading' }, [div({ class: 'panel-title' }, title)]),
            div({ class: 'panel-body' }, [
                div({ dataElement: elementName, class: 'container-fluid' }),
            ]),
        ]);
    }

    /**
     * Build a static (non-collapsing) bootstrap panel
     * @param {object} args with keys
     *      id      - id attribute for the panel (optional)
     *      type    - the type of bootstrap panel (e.g. primary) (opt.)
     *      classes - extra classes to apply to the panel container div (opt.)
     *      hidden  - if present, the 'hidden' class is applied (opt)
     *      icon    - args to buildIcon; the icon will appear next to the title (opt)
     *      title   - panel title
     *      name    - name of the dataElement in the top div of the panel
     *      body    - panel contents
     *
     * @returns {string} HTML string to create the panel
     */
    function buildPanel(args) {
        const type = args.type || 'primary';
        let classes = ['panel', 'panel-' + type],
            icon;
        if (args.hidden) {
            classes.push('hidden');
        }
        if (args.classes) {
            classes = classes.concat(args.classes);
        }
        if (args.icon) {
            icon = [' ', buildIcon(args.icon)];
        }
        return div(
            {
                class: classes.join(' '),
                dataElement: args.name,
            },
            [
                (function () {
                    if (args.title) {
                        return div({ class: 'panel-heading' }, [
                            div({ class: 'panel-title', dataElement: 'title' }, [
                                args.title,
                                icon,
                            ]),
                        ]);
                    }
                })(),
                div(
                    {
                        class: 'panel-body',
                        dataElement: 'body',
                    },
                    [args.body]
                ),
            ]
        );
    }

    /**
     * Make a collapsible bootstrap panel with default styling
     * @param {string} title - panel title
     * @param {string} elementName - name for the data element in the panel body
     *
     * @returns {string} HTML string to create the panel
     */
    function makeCollapsiblePanel(title, elementName) {
        const collapseId = html.genId();

        return div({ class: 'panel panel-default' }, [
            div({ class: 'panel-heading' }, [
                div(
                    { class: 'panel-title' },
                    span(
                        {
                            class: 'collapsed',
                            dataToggle: 'collapse',
                            dataTarget: '#' + collapseId,
                            style: { cursor: 'pointer' },
                        },
                        title
                    )
                ),
            ]),
            div(
                { id: collapseId, class: 'panel-collapse collapse' },
                div({ class: 'panel-body' }, [
                    div({ dataElement: elementName, class: 'container-fluid' }),
                ])
            ),
        ]);
    }

    /**
     * Build a collapsible bootstrap panel
     * @param {object} args with keys
     *      id      - id attribute for the panel (optional)
     *      type    - the type of bootstrap panel (e.g. primary) (opt.)
     *      classes - extra classes to apply to the panel container div (opt.)
     *      hidden  - if present, the 'hidden' class is applied (opt)
     *      collapsed   - panel starts collapsed (opt)
     *      icon    - args to buildIcon; the icon will appear next to the title (opt)
     *      title   - panel title
     *      name    - name of the dataElement in the top div of the panel
     *      body    - panel contents
     *
     * @returns {string} HTML string to create the panel
     */

    function buildCollapsiblePanel(args) {
        const panelId = args.id || html.genId(),
            collapseId = html.genId(),
            type = args.type || 'primary',
            collapseClasses = ['panel-collapse collapse'],
            toggleClasses = [];
        let icon,
            classes = ['panel', 'panel-' + type];

        if (args.hidden) {
            classes.push('hidden');
            // style.display = 'none';
        }
        if (!args.collapsed) {
            collapseClasses.push('in');
        } else {
            toggleClasses.push('collapsed');
        }
        if (args.classes) {
            classes = classes.concat(args.classes);
        }
        if (args.icon) {
            icon = [' ', buildIcon(args.icon)];
        }
        return div(
            {
                id: panelId,
                class: classes.join(' '),
                dataElement: args.name,
            },
            [
                div({ class: 'panel-heading' }, [
                    div(
                        { class: 'panel-title' },
                        span(
                            {
                                dataElement: 'title',
                                class: toggleClasses.join(' '),
                                dataToggle: 'collapse',
                                dataTarget: '#' + collapseId,
                                style: { cursor: 'pointer' },
                            },
                            [args.title, icon]
                        )
                    ),
                ]),
                div(
                    { id: collapseId, class: collapseClasses.join(' ') },
                    div({ class: 'panel-body', dataElement: 'body' }, [args.body])
                ),
            ]
        );
    }

    function buildIcon(arg) {
        const klasses = ['fa'],
            style = { verticalAlign: 'middle' };
        klasses.push('fa-' + arg.name);
        if (arg.rotate) {
            klasses.push('fa-rotate-' + String(arg.rotate));
        }
        if (arg.flip) {
            klasses.push('fa-flip-' + arg.flip);
        }
        if (arg.size) {
            if (typeof arg.size === 'number') {
                klasses.push('fa-' + String(arg.size) + 'x');
            } else {
                klasses.push('fa-' + arg.size);
            }
        }
        if (arg.classes) {
            arg.classes.forEach((klass) => {
                klasses.push(klass);
            });
        }
        if (arg.style) {
            Object.keys(arg.style).forEach((key) => {
                style[key] = arg.style[key];
            });
        }
        if (arg.color) {
            style.color = arg.color;
        }

        return span({
            dataElement: 'icon',
            style: style,
            class: klasses.join(' '),
        });
    }

    function confirmDialog(prompt) {
        return window.confirm(prompt);
    }

    function renderConfirmDialog(arg) {
        const yesLabel = arg.yesLabel || 'Yes',
            noLabel = arg.noLabel || 'No';
        const dialog = div({ class: 'modal fade', tabindex: '-1', role: 'dialog' }, [
            div({ class: 'modal-dialog' }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' }, [
                        button(
                            {
                                type: 'button',
                                class: 'close',
                                dataDismiss: 'modal',
                                ariaLabel: noLabel,
                            },
                            [span({ ariaHidden: 'true' }, '&times;')]
                        ),
                        span({ class: 'modal-title' }, arg.title),
                    ]),
                    div({ class: 'modal-body' }, [arg.body]),
                    div({ class: 'modal-footer' }, [
                        button(
                            {
                                type: 'button',
                                class: 'btn btn-default',
                                dataDismiss: 'modal',
                                dataElement: 'no',
                            },
                            noLabel
                        ),
                        button(
                            { type: 'button', class: 'btn btn-primary', dataElement: 'yes' },
                            yesLabel
                        ),
                    ]),
                ]),
            ]),
        ]);
        return dialog;
    }

    function showConfirmDialog(arg) {
        const dialog = renderConfirmDialog(arg),
            dialogId = html.genId(),
            confirmNode = document.createElement('div');
        let kbaseNode, modalNode;

        confirmNode.id = dialogId;
        confirmNode.innerHTML = dialog;

        // top level element for kbase usage
        kbaseNode = document.querySelector('[data-element="kbase"]');
        if (!kbaseNode) {
            kbaseNode = document.createElement('div');
            kbaseNode.setAttribute('data-element', 'kbase');
            document.body.appendChild(kbaseNode);
        }

        // a node uponwhich to place Bootstrap modals.
        modalNode = kbaseNode.querySelector('[data-element="modal"]');
        if (!modalNode) {
            modalNode = document.createElement('div');
            modalNode.setAttribute('data-element', 'modal');
            kbaseNode.appendChild(modalNode);
        }

        modalNode.appendChild(confirmNode);

        const modalDialogNode = modalNode.querySelector('.modal');

        $(modalDialogNode).modal('show');
        return new Promise((resolve) => {
            modalDialogNode
                .querySelector('[data-element="yes"]')
                .addEventListener('click', () => {
                    $(modalDialogNode).modal('hide');
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve(true);
                });
            modalDialogNode.addEventListener('keyup', (e) => {
                if (e.keyCode === 13) {
                    $(modalDialogNode).modal('hide');
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve(true);
                }
            });
            modalDialogNode
                .querySelector('[data-element="no"]')
                .addEventListener('click', () => {
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve(false);
                });
            modalDialogNode.addEventListener('hide.bs.modal', () => {
                resolve(false);
            });
        });
    }


    function renderInfoDialog(title, content, okLabel, type) {
        let extraClass = '';
        if (type) {
            extraClass = ' bg-' + type;
        }
        return div({ class: 'modal fade', tabindex: '-1', role: 'dialog' }, [
            div({ class: 'modal-dialog' }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' + extraClass }, [
                        button(
                            {
                                type: 'button',
                                class: 'close',
                                dataDismiss: 'modal',
                                ariaLabel: okLabel,
                            },
                            [span({ ariaHidden: 'true' }, '&times;')]
                        ),
                        span({ class: 'modal-title' }, title),
                    ]),
                    div({ class: 'modal-body' }, [content]),
                    div({ class: 'modal-footer' }, [
                        button(
                            {
                                type: 'button',
                                class: 'btn btn-default',
                                dataDismiss: 'modal',
                                dataElement: 'ok',
                            },
                            okLabel
                        ),
                    ]),
                ]),
            ]),
        ]);
    }

    function showInfoDialog(arg) {
        const dialog = renderInfoDialog(arg.title, arg.body, arg.okLabel || 'OK'),
            dialogId = html.genId(),
            confirmNode = document.createElement('div');
        let kbaseNode, modalNode;

        confirmNode.id = dialogId;
        confirmNode.innerHTML = dialog;

        // top level element for kbase usage
        kbaseNode = document.querySelector('[data-element="kbase"]');
        if (!kbaseNode) {
            kbaseNode = document.createElement('div');
            kbaseNode.setAttribute('data-element', 'kbase');
            document.body.appendChild(kbaseNode);
        }

        // a node upon which to place Bootstrap modals.
        modalNode = kbaseNode.querySelector('[data-element="modal"]');
        if (!modalNode) {
            modalNode = document.createElement('div');
            modalNode.setAttribute('data-element', 'modal');
            kbaseNode.appendChild(modalNode);
        }

        modalNode.appendChild(confirmNode);

        const modalDialogNode = modalNode.querySelector('.modal');
        $(modalDialogNode).modal('show');
        return new Promise((resolve) => {
            modalDialogNode.querySelector('[data-element="ok"]').addEventListener('click', () => {
                confirmNode.parentElement.removeChild(confirmNode);
                resolve(false);
            });
            modalDialogNode.addEventListener('hide.bs.modal', () => {
                resolve(false);
            });
        });
    }

    function buildError(error) {
        return table(
            {
                class: 'table table-striped',
            },
            [
                tr([th('Name'), td(error.name)]),
                tr([th('Code'), td(error.code)]),
                tr([th('Message'), td(error.message)]),
                tr([th('Detail'), td(error.detail)]),
                tr([th('Reference'), td(error.reference)]),
            ]
        );
    }

    function showErrorDialog(arg) {
        const body = buildError(arg.error),
            dialog = renderInfoDialog(arg.title, body, 'OK', 'danger'),
            dialogId = html.genId(),
            confirmNode = document.createElement('div');
        let kbaseNode, modalNode;

        confirmNode.id = dialogId;
        confirmNode.innerHTML = dialog;

        // top level element for kbase usage
        kbaseNode = document.querySelector('[data-element="kbase"]');
        if (!kbaseNode) {
            kbaseNode = document.createElement('div');
            kbaseNode.setAttribute('data-element', 'kbase');
            document.body.appendChild(kbaseNode);
        }

        // a node upon which to place Bootstrap modals.
        modalNode = kbaseNode.querySelector('[data-element="modal"]');
        if (!modalNode) {
            modalNode = document.createElement('div');
            modalNode.setAttribute('data-element', 'modal');
            kbaseNode.appendChild(modalNode);
        }

        modalNode.appendChild(confirmNode);

        const modalDialogNode = modalNode.querySelector('.modal');
        $(modalDialogNode).modal('show');
        return new Promise((resolve) => {
            modalDialogNode.querySelector('[data-element="ok"]').addEventListener('click', () => {
                confirmNode.parentElement.removeChild(confirmNode);
                resolve(false);
            });
            modalDialogNode.addEventListener('hide.bs.modal', () => {
                resolve(false);
            });
        });
    }

    function renderDialog(title, content, cancelLabel, buttons, options) {
        const style = {};
        if (options && options.width) {
            style.width = options.width;
        }
        return div({ class: 'modal fade', tabindex: '-1', role: 'dialog' }, [
            div({ class: 'modal-dialog', style: style }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' }, [
                        button(
                            {
                                type: 'button',
                                class: 'close',
                                dataDismiss: 'modal',
                                ariaLabel: cancelLabel,
                            },
                            [span({ ariaHidden: 'true' }, '&times;')]
                        ),
                        span({ class: 'modal-title kb-title' }, title),
                    ]),
                    div({ class: 'modal-body' }, [content]),
                    div(
                        { class: 'modal-footer' },
                        buttons
                            .map((btn) => {
                                return button(
                                    {
                                        type: 'button',
                                        class: 'btn btn-' + (btn.type || 'default'),
                                        dataElement: btn.action,
                                    },
                                    btn.label
                                );
                            })
                            .concat([
                                button(
                                    {
                                        type: 'button',
                                        class: 'btn btn-default',
                                        dataDismiss: 'modal',
                                        dataElement: 'cancel',
                                    },
                                    cancelLabel
                                ),
                            ])
                    ),
                ]),
            ]),
        ]);
    }

    function showDialog(args) {
        args.buttons = args.buttons || [];
        const dialog = renderDialog(
                args.title,
                args.body,
                args.cancelLabel || 'Cancel',
                args.buttons,
                args.options
            ),
            dialogId = html.genId(),
            confirmNode = document.createElement('div');
        let kbaseNode, modalNode;

        confirmNode.id = dialogId;
        confirmNode.innerHTML = dialog;

        // top level element for kbase usage
        kbaseNode = document.querySelector('[data-element="kbase"]');
        if (!kbaseNode) {
            kbaseNode = document.createElement('div');
            kbaseNode.setAttribute('data-element', 'kbase');
            document.body.appendChild(kbaseNode);
        }

        // a node upon which to place Bootstrap modals.
        modalNode = kbaseNode.querySelector('[data-element="modal"]');
        if (!modalNode) {
            modalNode = document.createElement('div');
            modalNode.setAttribute('data-element', 'modal');
            kbaseNode.appendChild(modalNode);
        }

        modalNode.appendChild(confirmNode);

        const modalDialogNode = modalNode.querySelector('.modal');
        $(modalDialogNode).modal('show');
        return new Promise((resolve, reject) => {
            modalDialogNode
                .querySelector('[data-element="cancel"]')
                .addEventListener('click', () => {
                    confirmNode.parentElement.removeChild(confirmNode);
                    resolve({
                        action: 'cancel',
                    });
                });
            args.buttons.forEach((btn) => {
                modalDialogNode
                    .querySelector('[data-element="' + btn.action + '"]')
                    .addEventListener('click', (e) => {
                        try {
                            const result = btn.handler(e);
                            if (result) {
                                $(modalDialogNode).modal('hide');
                                confirmNode.parentElement.removeChild(confirmNode);
                                resolve({
                                    action: btn.action,
                                    result: result,
                                });
                            }
                        } catch (ex) {
                            reject(ex);
                        }
                    });
            });

            modalDialogNode.addEventListener('hide.bs.modal', () => {
                resolve({
                    action: 'cancel',
                });
            });
        });
    }

    /**
     * Creates a spinning icon as a span. Returns the HTML as a string.
     * @param {Object} arg should have keys:
     *  - message {string} - an optional message to add to the spinner
     *  - size    {string} - an optional Font Awesome 4 size modifier (2x, 3x, etc)
     *  - color   {string} - an optional CSS color value
     *  - class   {string} - optional extra class(es) to add to the spinner
     */
    function loading(arg) {
        arg = arg || {};
        const prompt = arg.message
            ? `${arg.message}... &nbsp &nbsp`
            : '';
        const sizeClass = arg.size ? `fa-${arg.size}` : '';
        const style = arg.color ? {color: arg.color} : '';
        const extraClass = arg.class || '';

        return span([
            prompt,
            i({
                class: ['fa', 'fa-spinner', 'fa-pulse', sizeClass, extraClass, 'fa-fw', 'margin-bottom'].join(
                    ' '
                ),
                style: style,
            }),
        ]);
    }

    function factory(config) {
        const container = config.node,
            {bus} = config,
            runtime = Runtime.make();

        /*
         * Just a wrapper around querySelector
         */
        function getElement(names) {
            if (typeof names === 'string') {
                names = names.split('.');
            }
            if (names.length === 0) {
                return container;
            }
            const selector = names
                .map((name) => {
                    return '[data-element="' + name + '"]';
                })
                .join(' ');

            return container.querySelector(selector);
        }

        function qsa(node, selector) {
            return Array.prototype.slice.call(node.querySelectorAll(selector, 0));
        }

        function getElements(names) {
            if (typeof names === 'string') {
                names = names.split('.');
            }
            const selector = names
                .map((name) => {
                    return '[data-element="' + name + '"]';
                })
                .join(' ');

            return qsa(container, selector);
        }

        function getButton(name) {
            if (typeof name !== 'string') {
                // names = names.split('.');
                // TODO: support a path of elements up to the button.
                throw new Error('Currently only a single string supported to get a button');
            }
            const selector = '[data-button="' + name + '"]',
                buttonNode = container.querySelector(selector);

            if (!buttonNode) {
                throw new Error('Button ' + name + ' not found');
            }
            return buttonNode;
        }

        /*
         * Generic version of getElement
         * Returns a node which is accessible by the path.
         * Each path element is an object with
         * type = data-TYPE
         * name = value of the data-TYPE attribute
         */
        function getNode(names) {
            if (typeof names === 'string') {
                names = [names];
            }
            const selector = names
                .map((dataSelector) => {
                    return '[data-' + dataSelector.type + '="' + dataSelector.name + '"]';
                })
                .join(' ');

            return container.querySelector(selector);
        }

        /*
         * a node spec is a list of path segment specs, which are each a simple
         * object where the keys are the suffix to a data- attribute and the v
         * values are the values. Each segment is an array of these, which are
         * concatenated
         */
        function findNode(nodePath) {
            const selector = nodePath
                .map((pathElement) => {
                    return Object.keys(pathElement)
                        .map((dataKey) => {
                            const dataValue = pathElement[dataKey];
                            return '[data-' + dataKey + '="' + dataValue + '"]';
                        })
                        .join('');
                })
                .join(' ');

            return container.querySelector(selector);
        }


        function addButtonClickEvent(events, eventName, data) {
            return events.addEvent({
                type: 'click',
                handler: function (e) {
                    bus.send(
                        {
                            event: e,
                            button: e.target,
                            data: data,
                        },
                        {
                            key: {
                                type: eventName,
                            },
                        }
                    );
                },
            });
        }

        function makeButton(label, name, options) {
            const klass = options.type || 'default',
                {events} = options;
            return button(
                {
                    type: 'button',
                    class: ['btn', 'btn-' + klass].join(' '),
                    dataButton: name,
                    id: addButtonClickEvent(events, name),
                },
                label
            );
        }

        function buildButton(arg) {
            const klass = arg.type || 'default',
                {events} = arg,
                title = arg.title || arg.tip || arg.label;
            let buttonClasses = ['btn', 'btn-' + klass],
                icon;

            if (arg.icon) {
                if (!arg.icon.classes) {
                    arg.icon.classes = [];
                }
                icon = buildIcon(arg.icon);
            }

            if (arg.hidden) {
                buttonClasses.push('hidden');
            }

            if (arg.classes) {
                buttonClasses = buttonClasses.concat(arg.classes);
            }
            if (!arg.event) {
                arg.event = {};
            }

            const attribs = {
                type: 'button',
                class: buttonClasses.join(' '),
                title: title,
                dataButton: arg.name,
                id: addButtonClickEvent(events, arg.event.type || arg.name, arg.event.data),
                style: arg.style,
            };

            if (arg.features) {
                arg.features.forEach((feature) => {
                    attribs['data-feature-' + feature] = true;
                });
            }

            return button(
                attribs,
                [icon, span({ style: { verticalAlign: 'middle' } }, arg.label)].join('&nbsp;')
            );
        }

        function enableButton(name) {
            const _button = getButton(name);
            _button.classList.remove('hidden');
            _button.classList.remove('disabled');
            _button.removeAttribute('disabled');
        }

        function disableButton(name) {
            const _button = getButton(name);
            _button.classList.remove('hidden');
            _button.classList.add('disabled');
            _button.setAttribute('disabled', true);
        }

        function activateButton(name) {
            getButton(name).classList.add('active');
        }

        function deactivateButton(name) {
            getButton(name).classList.remove('active');
        }

        function hideButton(name) {
            getButton(name).classList.add('hidden');
        }

        function showButton(name) {
            getButton(name).classList.remove('hidden');
        }

        function setButtonLabel(name, label) {
            getButton(name).innerHTML = label;
        }

        function hideElement(name) {
            const el = getElement(name);
            if (!el) {
                return;
            }
            el.classList.add('hidden');
        }

        function showElement(name) {
            const el = getElement(name);
            if (!el) {
                return;
            }
            el.classList.remove('hidden');
        }

        function collapsePanel(path) {
            const node = getElement(path);
            if (!node) {
                return;
            }
            const collapseToggle = node.querySelector('[data-toggle="collapse"]'),
                targetSelector = collapseToggle.getAttribute('data-target'),
                collapseTarget = node.querySelector(targetSelector);
            $(collapseTarget).collapse('hide');
        }

        function expandPanel(path) {
            const node = getElement(path);
            if (!node) {
                return;
            }
            const collapseToggle = node.querySelector('[data-toggle="collapse"]'),
                targetSelector = collapseToggle.getAttribute('data-target'),
                collapseTarget = node.querySelector(targetSelector);
            $(collapseTarget).collapse('show');
        }

        function buildButtonToolbar(arg) {
            return div(
                {
                    class: ['btn-toolbar'].concat(arg.classes || []),
                },
                [
                    div(
                        {
                            class: 'btn-group',
                        },
                        arg.buttons
                    ),
                ]
            );
        }

        function createNode(markup) {
            const node = document.createElement('div');
            node.innerHTML = markup;
            return node.firstChild;
        }

        function setContent(path, content) {
            const nodes = getElements(path);
            nodes.forEach((_node) => {
                _node.innerHTML = content;
            });
        }

        function setText(path, text) {
            const node = getElements(path);
            node.forEach((_node) => {
                _node.innerText = text;
            });
        }

        function enableTooltips(path) {
            const node = getElement(path);
            if (!node) {
                return;
            }
            qsa(node, '[data-toggle="tooltip"]').forEach((_node) => {
                $(_node).tooltip();
            });
        }

        function addClass(path, klass) {
            const node = getElement(path);
            if (node) {
                if (!node.classList.contains(klass)) {
                    node.classList.add(klass);
                }
            }
        }

        function removeClass(path, klass) {
            const node = getElement(path);
            if (node) {
                node.classList.remove(klass);
            }
        }

        function getUserSetting(settingKey, defaultValue) {
            const settings = Jupyter.notebook.metadata.kbase.userSettings;
            if (!settings) {
                return defaultValue;
            }
            const setting = settings[settingKey];
            if (setting === undefined) {
                return defaultValue;
            }
            return setting;
        }

        function ifAdvanced(fun) {
            const userIsAdvanced = getUserSetting('advanced', runtime.config('features.advanced'));
            if (userIsAdvanced) {
                return fun();
            }
        }

        function ifDeveloper(fun) {
            const userIsDeveloper = getUserSetting(
                'developer',
                runtime.config('features.developer')
            );
            if (userIsDeveloper) {
                return fun();
            }
        }

        function isAdvanced() {
            const userIsAdvanced = getUserSetting('advanced', runtime.config('features.advanced'));
            if (userIsAdvanced) {
                return true;
            }
            return false;
        }

        function isDeveloper() {
            const userIsDeveloper = getUserSetting(
                'developer',
                runtime.config('features.developer')
            );
            if (userIsDeveloper) {
                return true;
            }
            return false;
        }

        function updateTab(tabId, tabName, updates) {
            const node = document.getElementById(tabId);
            if (!node) {
                return;
            }

            // Update tab label
            const tabTab = findNode([
                {
                    element: 'tab',
                    name: tabName,
                },
            ]);

            // Update tab label
            if (updates.label) {
                const labelNode = tabTab.querySelector('[data-element="label"]');
                if (labelNode) {
                    labelNode.innerHTML = updates.label;
                }
            }

            // update the tab icon
            if (updates.icon) {
                const iconNode = tabTab.querySelector('[data-element="icon"]');
                if (iconNode) {
                    // remove any icons.
                    let {classList} = iconNode;
                    for (let x = classList.length; classList > 0; classList -= 1) {
                        if (classList.item[x].substring(0, 3) === 'fa-') {
                            classList.remove(classList.item[x]);
                        }
                    }
                    iconNode.classList.add('fa-' + updates.icon);
                }
            }

            // update tab color
            if (updates.color) {
                tabTab.style.color = updates.color;
            }

            // switch to tab
            // if (updates.select) {
            // }
        }

        function buildTabs(arg) {
            const tabsId = arg.id,
                tabsAttribs = {},
                tabClasses = ['nav', 'nav-tabs'],
                tabStyle = {},
                tabs = arg.tabs.filter((tab) => {
                    return tab ? true : false;
                }),
                events = [],
                tabMap = {},
                panelClasses = ['tab-pane'];
            let activeIndex,
                tabTabs,
                selectInitialTab = false;

            if (arg.fade) {
                panelClasses.push('fade');
            }

            if (typeof arg.initialTab === 'number') {
                selectInitialTab = true;
            }

            if (tabsId) {
                tabsAttribs.id = tabsId;
            }

            tabs.forEach((tab) => {
                tab.panelId = html.genId();
                tab.tabId = html.genId();
                if (tab.name) {
                    tabMap[tab.name] = tab.tabId;
                }
                if (tab.events) {
                    tab.events.forEach((event) => {
                        events.push({
                            id: tab.tabId,
                            jquery: true,
                            type: event.type + '.bs.tab',
                            handler: event.handler,
                        });
                    });
                }
            });
            if (arg.alignRight) {
                tabTabs = tabs.reverse();
                tabStyle.float = 'right';
                if (selectInitialTab) {
                    activeIndex = tabs.length - 1 - arg.initialTab;
                }
            } else {
                tabTabs = tabs;
                if (selectInitialTab) {
                    activeIndex = arg.initialTab;
                }
            }
            const content = div(tabsAttribs, [
                ul(
                    { class: tabClasses.join(' '), role: 'tablist' },
                    tabTabs.map((tab, index) => {
                        const tabAttribs = {
                                role: 'presentation',
                            },
                            linkAttribs = {
                                href: '#' + tab.panelId,
                                dataElement: 'tab',
                                ariaControls: tab.panelId,
                                role: 'tab',
                                id: tab.tabId,
                                dataPanelId: tab.panelId,
                                dataToggle: 'tab',
                            },
                            label = span({ dataElement: 'label' }, tab.label);
                        let icon;
                        if (tab.icon) {
                            icon = buildIcon({ name: tab.icon });
                        } else {
                            icon = '';
                        }

                        if (tab.name) {
                            linkAttribs.dataName = tab.name;
                        }
                        if (selectInitialTab) {
                            if (index === activeIndex) {
                                tabAttribs.class = 'active';
                            }
                        }
                        tabAttribs.style = tabStyle;
                        return li(tabAttribs, a(linkAttribs, [icon, label].join(' ')));
                    })
                ),
                div(
                    { class: 'tab-content' },
                    tabs.map((tab, index) => {
                        const attribs = {
                            role: 'tabpanel',
                            class: panelClasses.join(' '),
                            id: tab.panelId,
                            style: arg.style || {},
                        };
                        if (tab.name) {
                            attribs.dataName = tab.name;
                        }
                        if (index === 0) {
                            attribs.class += ' active';
                        }
                        return div(attribs, tab.content);
                    })
                ),
            ]);
            return {
                content: content,
                events: events,
                map: tabMap,
            };
        }

        // TURN THIS INTO A MINI WIDGET!
        function jsonBlockWidget() {
            function jsonBlockWidgetFactory(cfg) {
                const jsonBlockWidgetConfig = cfg || {},
                    indent = jsonBlockWidgetConfig.indent || 3,
                    fontSize = jsonBlockWidgetConfig.fontSize || 0.8;

                function render(obj) {
                    const specText = JSON.stringify(obj, false, indent),
                        fixedText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    return pre(
                        {
                            class: 'prettyprint lang-json',
                            style: {
                                fontSize: String(fontSize * 100) + '%',
                            },
                        },
                        fixedText
                    );
                }

                function start(arg) {
                    return Promise.try(() => {
                        arg.node.innerHTML = render(arg.obj);
                        PR.prettyPrint(null, arg.node);
                    });
                }

                function stop() {
                    return Promise.resolve;
                }

                return {
                    start: start,
                    stop: stop,
                };
            }
            return {
                make: function (args) {
                    return jsonBlockWidgetFactory(args);
                },
            };
        }

        function buildGridTable(arg) {
            return arg.table.map((row) => {
                return div(
                    { class: 'row', style: arg.row.style },
                    arg.cols.map((col, index) => {
                        return div(
                            { class: 'col-md-' + String(col.width), style: col.style },
                            row[index]
                        );
                    })
                );
            });
        }

        function camelToHyphen(s) {
            return s.replace(/[A-Z]/g, (m) => {
                return '-' + m.toLowerCase();
            });
        }

        function updateFromViewModel(viewModel, path) {
            if (!path) {
                path = [];
            }
            const node = getElement(path);
            if (!node) {
                return;
            }
            if (typeof viewModel === 'string') {
                setContent(path, viewModel);
            } else if (typeof viewModel === 'number') {
                setContent(path, String(viewModel));
            } else if (viewModel === null) {
                setContent(path, '');
            } else {
                Object.keys(viewModel).forEach((key) => {
                    const value = viewModel[key];
                    if (key === '_attrib') {
                        Object.keys(value).forEach((attribKey) => {
                            const attribValue = value[attribKey];
                            // console.log('attrib?', attribKey, attribValue);
                            switch (attribKey) {
                                case 'hidden':
                                    // console.log('HIDING?', attribKey, node, attribValue);
                                    if (attribValue) {
                                        node.classList.add('hidden');
                                    } else {
                                        node.classList.remove('hidden');
                                    }
                                    break;
                                case 'style':
                                    Object.keys(attribValue).forEach((_key) => {
                                        node.style[camelToHyphen(_key)] = attribValue[_key];
                                    });
                            }
                        });
                    } else {
                        updateFromViewModel(value, path.concat(key));
                    }
                });
            }
        }

        function buildPresentableJson(data) {
            switch (typeof data) {
                case 'string':
                    return data;
                case 'number':
                    return String(data);
                case 'boolean':
                    return String(data);
                case 'object':
                    if (data === null) {
                        return 'NULL';
                    }
                    if (data instanceof Array) {
                        return table(
                            { class: 'table table-striped' },
                            data
                                .map((datum, index) => {
                                    return tr([th(String(index)), td(buildPresentableJson(datum))]);
                                })
                                .join('\n')
                        );
                    }
                    return table(
                        { class: 'table table-striped' },
                        Object.keys(data)
                            .map((key) => {
                                return tr([th(key), td(buildPresentableJson(data[key]))]);
                            })
                            .join('\n')
                    );
                default:
                    return 'Not representable: ' + typeof data;
            }
        }

        function _buildError(err) {
            return [
                buildPanel({
                    title: 'Message',
                    body: err.message,
                    classes: ['kb-panel-light'],
                }),
                err.fileName
                    ? buildPanel({
                          title: 'File',
                          body: err.fileName,
                          classes: ['kb-panel-light'],
                      })
                    : '',
                err.lineNumber
                    ? buildPanel({
                          title: 'Line number',
                          body: err.lineNumber,
                          classes: ['kb-panel-light'],
                      })
                    : '',
                err.columnNumber
                    ? buildPanel({
                          title: 'Column number',
                          body: err.columnNumber,
                          classes: ['kb-panel-light'],
                      })
                    : '',
            ].join('\n');
        }

        function buildErrorStacktrace(err) {
            return div(
                {
                    class: 'kb-error-dialog__stacktrace_container',
                },
                [
                ol(
                    {
                        class: 'kb-error-dialog__stacktrace_lines',
                    },
                    err.stack.split(/\n/)
                        .filter((item) => (item.length))
                        .map((item) => {
                        return li(
                            {
                                class: 'kb-error-dialog__stacktrace_single_line',
                            },
                            [htmlEncode(item)]
                        );
                    })
                ),
            ]);
        }

        function buildErrorTabs(arg) {
            return html.makeTabs({
                tabs: [
                    {
                        label: 'Summary',
                        name: 'summary',
                        content: div(
                            [
                                p({
                                    class: 'kb-error-dialog__err_preamble',
                                },
                                arg.preamble),
                                p({
                                    class: 'kb-error-dialog__err_message',
                                },
                                arg.error.message),
                            ]
                        ),
                    },
                    {
                        label: 'Details',
                        name: 'details',
                        content: div(
                            [_buildError(arg.error)]
                        ),
                    },
                    {
                        label: 'Stack Trace',
                        name: 'stacktrace',
                        content: div(
                            [
                                buildPanel({
                                    title: 'Javascript Stack Trace',
                                    body: buildErrorStacktrace(arg.error),
                                    classes: ['kb-panel-light'],
                                }),
                            ]
                        ),
                    },
                ],
            });
        }

        return Object.freeze({
            activateButton: activateButton,
            addClass: addClass,
            buildButton: buildButton,
            buildButtonToolbar: buildButtonToolbar,
            buildCollapsiblePanel: buildCollapsiblePanel,
            buildErrorTabs: buildErrorTabs,
            buildGridTable: buildGridTable,
            buildIcon: buildIcon,
            buildPanel: buildPanel,
            buildPresentableJson: buildPresentableJson,
            buildTabs: buildTabs,
            collapsePanel: collapsePanel,
            confirmDialog: confirmDialog,
            createNode: createNode,
            deactivateButton: deactivateButton,
            disableButton: disableButton,
            enableButton: enableButton,
            enableTooltips: enableTooltips,
            expandPanel: expandPanel,
            getButton: getButton,
            getElement: getElement,
            getElements: getElements,
            getNode: getNode,
            hideButton: hideButton,
            hideElement: hideElement,
            htmlEncode: htmlEncode,
            ifAdvanced: ifAdvanced,
            ifDeveloper: ifDeveloper,
            isAdvanced: isAdvanced,
            isDeveloper: isDeveloper,
            jsonBlockWidget: jsonBlockWidget(),
            loading: loading,
            makeButton: makeButton,
            makeCollapsiblePanel: makeCollapsiblePanel,
            makePanel: makePanel,
            na: na,
            removeClass: removeClass,
            setButtonLabel: setButtonLabel,
            setContent: setContent,
            setText: setText,
            showButton: showButton,
            showConfirmDialog: showConfirmDialog,
            showDialog: showDialog,
            showElement: showElement,
            showErrorDialog: showErrorDialog,
            showInfoDialog: showInfoDialog,
            updateFromViewModel: updateFromViewModel,
            updateTab: updateTab,
        });
    }

    return {
        make: function (config) {
            return factory(config);
        },
        // "static" methods
        buildCollapsiblePanel: buildCollapsiblePanel,
        buildIcon: buildIcon,
        buildPanel: buildPanel,
        htmlEncode: htmlEncode,
        confirmDialog: confirmDialog,
        loading: loading,
        makeCollapsiblePanel: makeCollapsiblePanel,
        makePanel: makePanel,
        na: na,
        showConfirmDialog: showConfirmDialog,
        showDialog: showDialog,
        showErrorDialog: showErrorDialog,
        showInfoDialog: showInfoDialog,
    };
});
