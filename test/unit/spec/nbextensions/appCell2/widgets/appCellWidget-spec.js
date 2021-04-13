define([
    '../../../../../../../narrative/nbextensions/appCell2/widgets/appCellWidget',
    'common/runtime',
    'base/js/namespace',
    '/test/data/jobsData',
    'testUtil',
], (AppCell, Runtime, Jupyter, JobsData, TestUtil) => {
    'use strict';
    let appCellInstance;

    const workspaceInfo = {
        globalread: 'n',
        id: 54745,
        lockstat: 'unlocked',
        metadata: {
            cell_count: '1',
            narrative_nice_name: 'Test Narrative',
            searchtags: 'narrative',
            is_temporary: 'false',
            narrative: '1',
        },
        moddate: '2020-10-06T03:30:52+0000',
        name: 'testUser:narrative_1601948894239',
        object_count: 1,
        owner: 'testUser',
        user_permission: 'a',
    };

    const cell = {
        cell_type: 'code',
        metadata: {
            kbase: {
                type: 'app',
                attributes: {
                    created: 'Fri, 27 Mar 2020 17:39:10 GMT',
                    id: '71e12dca-3a12-4dd7-862b-125f4337e723',
                    info: {
                        label: 'more...',
                        url: '/#appcatalog/app/simpleapp/example_method/beta',
                    },
                    lastLoaded: 'Tue, 06 Oct 2020 23:28:26 GMT',
                    status: 'new',
                    subtitle: 'Perform some kind of method',
                    title: 'SimpleApp Simple Add',
                },
                appCell: {
                    app: {
                        spec: {
                            parameters: [
                                {
                                    advanced: 0,
                                    allow_multiple: 0,
                                    default_values: ['0'],
                                    description:
                                        'The first parameter that needs to be entered to drive the method. This might be the first of many.',
                                    disabled: 0,
                                    field_type: 'text',
                                    id: 'base_number',
                                    optional: 1,
                                    short_hint: 'The first parameter',
                                    text_options: {
                                        is_output_name: 0,
                                        placeholder: '',
                                        regex_constraint: [],
                                        valid_ws_types: [],
                                        validate_as: 'int',
                                        ui_class: 'parameter',
                                        ui_name: 'base_number',
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
    };

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    // Can only test the public functions...
    describe('The appCell widget', () => {
        beforeEach(() => {
            appCellInstance = AppCell.make({
                workspaceInfo: workspaceInfo,
                bus: Runtime.make().bus(),
                cell: cell,
            });

            Jupyter.notebook = {
                writable: true,
            };
            Jupyter.narrative = {
                readonly: false,
            };
        });

        afterEach(() => {
            appCellInstance = null;
            window.kbaseRuntime = null;
            Jupyter.notebook = null;
            Jupyter.narrative = null;
        });

        it('Should load', () => {
            expect(AppCell).not.toBe(null);
        });

        it('Should return a make function', () => {
            expect(AppCell.make).toBeDefined();
        });

        it('Can be instantiated', () => {
            expect(appCellInstance).not.toBe(null);
        });

        it('Has expected functions when instantiated', () => {
            ['init', 'attach', 'start', 'stop', 'detach'].forEach((fn) => {
                expect(appCellInstance[fn]).toBeDefined();
            });
        });

        it('has a method "init" which sets up the code area and FSM', () => {
            expect(cell.metadata.kbase.appCell['user-settings']).not.toBeDefined();
            expect(appCellInstance.__fsm()).toBeUndefined();
            return appCellInstance.init().then(() => {
                expect(cell.metadata.kbase.appCell['user-settings']).toEqual({
                    showCodeInputArea: false,
                });
                expect(appCellInstance.__fsm()).toEqual(jasmine.any(Object));
                expect(appCellInstance.__fsm().getCurrentState().state).toEqual({ mode: 'new' });
            });
        });

        describe('the initialised cell', () => {
            beforeEach(async () => {
                await appCellInstance.init();
            });

            xit('has a method stop which returns a Promise', () => {
                return appCellInstance
                    .init()
                    .then(() => {
                        return appCellInstance.stop();
                    })
                    .then(() => {
                        // something to see if it worked.
                    });
            });

            xit('has a method detach which returns a Promise', () => {
                return appCellInstance
                    .init()
                    .then(() => {
                        return appCellInstance.stop();
                    })
                    .then(() => {
                        return appCellInstance.detach();
                    })
                    .then(() => {
                        //see if it worked.
                    });
            });
        });
    });

    xdescribe('FSM transitions', () => {
        const appCellInfo = cell,
            jobId = 'fake_job';
        let container;
        // skip the app spec validation stuff
        appCellInfo.metadata.kbase.type = 'devapp';
        // app in the 'Sending...' state
        appCellInfo.metadata.kbase.appCell.fsm = { currentState: { mode: 'execute-requested' } };
        // invalid job to trigger listening for job messages
        appCellInfo.metadata.kbase.appCell.exec = { jobState: { job_id: jobId } };

        beforeAll(function () {
            this.runtime = Runtime.make();
            this.bus = Runtime.make().bus();
        });
        afterAll(() => {
            window.kbaseRuntime = null;
        });

        beforeEach(async function () {
            container = document.createElement('div');
            appCellInstance = AppCell.make({
                workspaceInfo: workspaceInfo,
                bus: this.bus,
                cell: cell,
            });

            Jupyter.notebook = {
                writable: true,
            };
            Jupyter.narrative = {
                readonly: false,
            };
            await appCellInstance.init();
        });

        afterEach(function () {
            appCellInstance.stop();

            appCellInstance = null;
            Jupyter.notebook = null;
            Jupyter.narrative = null;
        });

        JobsData.validJobs.forEach((jobState) => {
            it('transitions correctly to state ', async function () {
                await appCellInstance.attach(container);
                await appCellInstance.run();
                const message = [
                    Object.assign(
                        {},
                        { jobId: jobId },
                        { jobState: Object.assign({}, jobState, { job_id: jobId }) }
                    ),
                    {
                        channel: {
                            jobId: jobId,
                        },
                        key: {
                            type: 'job-status',
                        },
                    },
                ];
                this.bus.send(...message);
                return TestUtil.waitForElementChange(
                    container.querySelector('[data-element="fsm-display"]')
                ).then(() => {
                    expect(appCellInstance.__fsm().getCurrentState().state).toEqual(
                        jobState.meta.appCellFsm
                    );
                });
            });
        });
    });
});
