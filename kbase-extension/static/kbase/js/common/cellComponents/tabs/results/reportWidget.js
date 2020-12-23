/**
 * This renders a list of KBase Report objects. Each one is expandable and loads up under a caret.
 */
define(['bluebird', 'common/html', 'common/ui', 'common/events'], function (
    Promise,
    html,
    UI,
    Events
) {
    'use strict';

    let tag = html.tag,
        div = tag('div');

    function ReportWidget() {
        let container, ui;

        function renderReport(data) {
            return new Promise((resolve) => {
                console.log('ready to render report with data: ', data);
                resolve(true);
            });
        }

        function fetchReportData(reports, workspaceClient) {
            const reportLookupParam = reports.map(report => ({ref: report}));

            return workspaceClient.get_object_info_new({objects: reportLookupParam});
        }

        function renderLayout() {
            const events = Events.make();

            const content = ui.buildCollapsiblePanel({
                title: 'Report',
                name: 'report-section-toggle',
                hidden: false,
                type: 'default',
                classes: ['kb-panel-container'],
                body: div,
            });

            const reportContainer = div({ dataElement: 'report-widget' }, [content]);
            const reportPanel = div({ dataElement: 'html-panel' }, [reportContainer]);

            return {
                content: reportPanel,
                events: events,
            };
        }

        /**
         *
         * @param {object} arg
         * - node - the DOM node to attach to
         * - reports - an array of report references to render from
         * - workspaceClient - a workspace client to use to fetch report info
         */
        function doAttach(arg) {
            container = arg.node;
            ui = UI.make({
                node: container,
            });

            return fetchReportData(arg.reports, arg.workspaceClient)
                .then((reportData) => {
                    let layout = renderLayout();

                    container.innerHTML = layout.content;
                    layout.events.attachEvents(container);
                });
        }

        /**
         *
         * @param {object} arg
         * - node - the DOM node to build this under
         * - reports - a list of report ids to fetch the relevant info from
         * - workspaceClient - a workspace client to use
         */
        function start(arg) {
            // send parent the ready message
            return doAttach(arg)
                .catch((err) => {
                    console.error('Error while starting the created objects view', err);
                });
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: ReportWidget,
    };
});
