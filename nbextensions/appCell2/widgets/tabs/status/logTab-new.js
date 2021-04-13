/**
 * This is the entrypoint module for the job status / log viewer tab of the app cell.
 */
define([
    'bluebird',
    'kb_common/html',
    'common/ui',
    'common/runtime',
    'util/jobLogViewer',
    './jobStateList',
    './jobInputParams',
    'common/cellComponents/tabs/jobStatus/jobStatusTab',
    'common/cellComponents/tabs/jobStatus/jobStateList',
], (
    Promise,
    html,
    UI,
    Runtime,
    JobLogViewer,
    JobStateList,
    JobInputParams,
    JobStatusTab,
    NewJobStateList
) => {
    'use strict';

    const t = html.tag,
        div = t('div');

    function factory(config) {
        // The top level node used by this widget.
        let container;

        // The handy UI module interface to this container.
        let ui;

        // A cheap widget collection.
        const widgets = {},
            { model } = config,
            runtime = Runtime.make(),
            listeners = [];

        /**
         * Used only if we're in Batch mode.
         */
        function batchLayout() {
            const list = div(
                { class: 'col-md-3 batch-mode-col', dataElement: 'kb-job-list-wrapper' },
                [
                    ui.buildPanel({
                        title: 'Job Batch',
                        name: 'subjobs',
                        classes: ['kb-panel-light'],
                    }),
                ]
            );

            const jobStatus = div(
                { class: 'col-md-9 batch-mode-col', dataElement: 'kb-job-status-wrapper' },
                [
                    ui.buildCollapsiblePanel({
                        title: 'Job Params',
                        name: 'job-params-section-toggle',
                        hidden: false,
                        type: 'default',
                        classes: ['kb-panel-container'],
                        body: div({}, [
                            ui.buildPanel({
                                name: 'params',
                                classes: ['kb-panel-light'],
                            }),
                        ]),
                    }),
                    ui.buildCollapsiblePanel({
                        title: 'Job Status and Logs',
                        name: 'job-log-section-toggle',
                        hidden: false,
                        type: 'default',
                        collapsed: true,
                        classes: ['kb-panel-container'],
                        body: div({}, [
                            ui.buildPanel({
                                name: 'log',
                                classes: ['kb-panel-light'],
                            }),
                        ]),
                    }),
                ]
            );
            return div({}, [list, jobStatus]);
        }

        function queueLayout() {
            return div(
                {
                    dataElement: 'kb-job-status-wrapper',
                },
                ['This job is currently queued for execution and will start running soon.']
            );
        }

        function getSelectedJobId() {
            return config.clickedId;
        }

        function startParamsListener(jobId) {
            listeners.push(
                runtime.bus().listen({
                    channel: {
                        jobId: jobId,
                    },
                    key: {
                        type: 'job-info',
                    },
                    handle: handleJobInfoUpdate,
                })
            );
        }

        /**
         * parse and update the row with job info
         * @param {Object} message
         */
        function handleJobInfoUpdate(message) {
            if (message.jobId && message.jobInfo) {
                container.innerHTML = batchLayout();
                const jobParams = message.jobInfo.job_params[0].batch_params;
                console.log(jobParams);

                //display widgets
                widgets.params = JobInputParams.make({
                    model: model,
                });
                widgets.log = JobLogViewer.make({ showHistory: true });
                widgets.stateList = NewJobStateList.make();

                // const childJobs = model.getItem('exec.jobState.child_jobs');
                // let selectedJobId = model.getItem('exec.jobState.job_id')
                // if (childJobs.length > 0) {
                //     selectedJobId = childJobs.job_id;
                // }
                startDetails({
                    jobId: model.getItem('exec.jobState.job_id'),
                    isParentJob: true,
                });

                function startDetails(arg) {
                    const jobId = arg.jobId ? arg.jobId : model.getItem('exec.jobState.job_id');
                    config.clickedId = jobId;
                    return Promise.all([
                        widgets.params.start({
                            node: ui.getElement('params.body'),
                            jobId: jobId,
                            parentJobId: model.getItem('exec.jobState.job_id'),
                            isParentJob: arg.isParentJob,
                        }),
                        widgets.log.start({
                            node: ui.getElement('log.body'),
                            jobId: jobId,
                            parentJobId: model.getItem('exec.jobState.job_id'),
                        }),
                    ]);
                }

                return Promise.all([
                    widgets.stateList.start({
                        node: ui.getElement('subjobs.body'),
                        jobState: model.getItem('exec.jobState'),
                        includeParentJob: 1,
                        // childJobs: model.getItem('exec.jobState.child_jobs'),
                        // clickFunction: startDetails,
                        // parentJobId: model.getItem('exec.jobState.job_id'),
                        // batchSize: model.getItem('exec.jobState.batch_size'),
                    }),
                ]);
            }
        }

        function startBatch() {
            // const statusTab = JobStatusTab.make(config);
            const parentJobId = model.getItem('exec.jobState.job_id');
            return Promise.try(() => {
                //     statusTab.start({ node: container })
                // });
                startParamsListener(parentJobId);
                runtime.bus().emit('request-job-info', {
                    jobId: parentJobId,
                    // TODO: check whether this param is required in ee2.5
                    // parentJobId: jobState.job_id,
                });
            });
        }

        /**
         * @param {object} arg
         *  - node - the node to attach this tab to
         */
        function start(arg) {
            container = arg.node.appendChild(document.createElement('div'));
            ui = UI.make({
                node: container,
            });

            const childJobs = model.getItem('exec.jobState.child_jobs');
            if ((childJobs && childJobs.length > 0) || model.getItem('user-settings.batchMode')) {
                startBatch();
            } else {
                startSingle();
            }
        }

        function startSingle() {
            return Promise.try(() => {
                container.innerHTML = div({
                    dataElement: 'log_body',
                });
                widgets.log = JobLogViewer.make({ showHistory: true });
                return Promise.all([
                    widgets.log.start({
                        node: ui.getElement('log_body'),
                        jobId: model.getItem('exec.jobState.job_id'),
                        jobState: model.getItem('exec.jobState'),
                    }),
                ]);
            });
        }

        function stop() {
            return Promise.try(() => {
                if (listeners) {
                    runtime.bus().removeListeners(listeners);
                }
                if (widgets) {
                    return Promise.all(
                        Object.keys(widgets).map((key) => {
                            return widgets[key].stop();
                        })
                    );
                }
            });
        }

        return {
            start: start,
            stop: stop,
            getSelectedJobId: getSelectedJobId,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
