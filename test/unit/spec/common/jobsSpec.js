define(['common/jobs', '/test/data/jobsData'], (Jobs, JobsData) => {
    'use strict';

    function arrayToHTML(array) {
        return array.map((item) => `<div>${item}</div>`).join('\n');
    }

    const jobsModuleExports = [
        'canCancel',
        'canRetry',
        'createCombinedJobState',
        'createJobStatusFromFsm',
        'createJobStatusLines',
        'isTerminalStatus',
        'isValidJobStateObject',
        'isValidJobInfoObject',
        'jobAction',
        'jobArrayToIndexedObject',
        'jobLabel',
        'jobNotFound',
        'jobStatusUnknown',
        'jobStrings',
        'niceState',
        'updateJobModel',
        'validJobStates',
    ];

    const jobsByStatus = {};
    // N.b. only one job of each status is saved here
    JobsData.allJobs.forEach((job) => {
        jobsByStatus[job.status] = job;
    });

    describe('Test Jobs module', () => {
        it('Should be loaded with the right functions', () => {
            expect(Jobs).toBeDefined();
            jobsModuleExports.forEach((f) => {
                expect(Jobs[f]).toBeDefined();
            });
        });
    });

    const badStates = [undefined, null, 'Mary Poppins', 12345678];

    describe('the isTerminalStatus function', () => {
        it('should return true if the job status is terminal', () => {
            ['completed', 'terminated', 'error', 'does_not_exist'].forEach((status) => {
                expect(Jobs.isTerminalStatus(status)).toBeTrue();
            });
        });
        it('should return false for jobs that are in progress', () => {
            ['created', 'estimating', 'queued', 'running'].forEach((status) => {
                expect(Jobs.isTerminalStatus(status)).toBeFalse();
            });
        });
        it('should return false for invalid job statuses', () => {
            badStates.forEach((status) => {
                expect(Jobs.isTerminalStatus(status)).toBeFalse();
            });
        });
    });

    describe('The isValidJobStateObject function', () => {
        it('Should know how to tell good job states', () => {
            JobsData.allJobs.forEach((elem) => {
                expect(Jobs.isValidJobStateObject(elem)).toBeTrue();
            });
        });

        it('Should know how to tell bad job states', () => {
            JobsData.invalidJobs.forEach((elem) => {
                expect(Jobs.isValidJobStateObject(elem)).toBeFalse();
            });
        });
    });

    describe('The isValidJobInfoObject function', () => {
        JobsData.validInfo.forEach((elem) => {
            it(`passes ${JSON.stringify(elem)}`, () => {
                expect(Jobs.isValidJobInfoObject(elem)).toBeTrue();
            });
        });

        JobsData.invalidInfo.forEach((elem) => {
            it(`fails ${JSON.stringify(elem)}`, () => {
                expect(Jobs.isValidJobInfoObject(elem)).toBeFalse();
            });
        });
    });

    ['canCancel', 'canRetry'].forEach((fn) => {
        describe(`the ${fn} function`, () => {
            JobsData.allJobs.forEach((jobState) => {
                it(`should respond ${jobState.meta[fn]} for ${jobState.job_id}`, () => {
                    expect(Jobs[fn](jobState)).toBe(jobState.meta[fn]);
                });
            });
        });
    });

    describe('createJobStatusLines', () => {
        let container;
        beforeAll(() => {
            container = document.createElement('div');
        });
        afterAll(() => {
            container.remove();
        });
        const args = [false, true];
        JobsData.allJobs.forEach((state) => {
            it(`should create an appropriate status string for ${state.job_id}`, () => {
                const statusLines = Jobs.createJobStatusLines(state);
                container.innerHTML = arrayToHTML(statusLines);
                expect(container.textContent).toContain(state.meta.createJobStatusLines.line);
            });
        });
        JobsData.allJobs.forEach((state) => {
            it(`should create an appropriate array in history mode for ${state.job_id}`, () => {
                const statusLines = Jobs.createJobStatusLines(state, true);
                container.innerHTML = arrayToHTML(statusLines);
                state.meta.createJobStatusLines.history.forEach((historyLine) => {
                    expect(container.textContent).toContain(historyLine);
                });
            });
        });

        it('should create an appropriate string if the job does not exist', () => {
            const state = { job_state: 'does_not_exist' };
            // Jobs.createJobStatusLines returns the same content, whether or not
            // history is shown
            args.forEach((arg) => {
                const statusLines = Jobs.createJobStatusLines(state, arg);
                container.innerHTML = arrayToHTML(statusLines);
                expect(container.textContent).toContain(JobsData.jobStrings.not_found);
            });
        });

        it('should return an appropriate string for dodgy jobStates', () => {
            JobsData.invalidJobs.forEach((state) => {
                args.forEach((arg) => {
                    const statusLines = Jobs.createJobStatusLines(state, arg);
                    container.innerHTML = arrayToHTML(statusLines);
                    expect(container.textContent).toContain(JobsData.jobStrings.unknown);
                });
            });
        });
    });

    describe('jobLabel', () => {
        const labelToState = [
            ['Mary Poppins', 'not found'],
            [null, 'not found'],
            [undefined, 'not found'],
            ['does_not_exist', 'not found'],
            ['estimating', 'queued'],
            ['queued', 'queued'],
            ['error', 'failed'],
            ['terminated', 'cancelled'],
            ['running', 'running'],
        ];
        labelToState.forEach((entry) => {
            it(`should create an abbreviated label when given the job state ${entry[0]}`, () => {
                expect(Jobs.jobLabel({ status: entry[0] })).toEqual(entry[1]);
            });
        });
    });

    describe('jobAction', () => {
        badStates.forEach((item) => {
            it(`should generate no action with the job state ${item}`, () => {
                expect(Jobs.jobAction({ status: item })).toEqual(null);
            });
        });
        JobsData.allJobs.forEach((state) => {
            it(`should generate a job action with the job state ${state.status}`, () => {
                expect(Jobs.jobAction(state)).toEqual(state.meta.jobAction);
            });
        });
    });

    describe('jobLabel', () => {
        badStates.forEach((item) => {
            it(`creates an appropriate label with the input ${JSON.stringify(item)}`, () => {
                expect(Jobs.jobLabel({ status: item })).toEqual('not found');
            });
        });
        JobsData.allJobs.forEach((state) => {
            it(`creates an appropriate label with input in state ${state.status}`, () => {
                // include extra error info
                expect(Jobs.jobLabel(state, true)).toEqual(
                    state.meta.jobLabelIncludeError || state.meta.jobLabel
                );
                // just the basic label
                expect(Jobs.jobLabel(state)).toEqual(state.meta.jobLabel);
            });
        });
    });

    describe('niceState', () => {
        let container;
        beforeAll(() => {
            container = document.createElement('div');
        });
        afterAll(() => {
            container.remove();
        });
        badStates.forEach((item) => {
            it(`should generate a nice state for the input ${item}`, () => {
                container.innerHTML = Jobs.niceState(item);
                const span = container.querySelector('span');
                expect(span).toHaveClass('kb-job-status__summary');
                expect(span.textContent).toContain('invalid');
            });
        });

        JobsData.allJobs.forEach((state) => {
            it(`should generate a nice state for ${state.status}`, () => {
                container.innerHTML = Jobs.niceState(state.status);
                const span = container.querySelector('span');
                expect(span).toHaveClass(state.meta.niceState.class);
                expect(span.textContent).toContain(state.meta.niceState.label);
            });
        });
    });

    describe('createJobStatusFromFsm', () => {
        let container;
        beforeAll(() => {
            container = document.createElement('div');
        });
        afterAll(() => {
            container.remove();
        });

        const tests = [
            { mode: 'error', stage: '', text: 'error', cssClass: 'error' },
            { mode: 'internal-error', stage: '', text: 'error', cssClass: 'error' },
            { mode: 'canceling', stage: '', text: 'canceled', cssClass: 'terminated' },
            { mode: 'canceled', stage: '', text: 'canceled', cssClass: 'terminated' },
            { mode: 'processing', stage: 'running', text: 'running', cssClass: 'running' },
            { mode: 'processing', stage: 'queued', text: 'queued', cssClass: 'queued' },
            { mode: 'success', stage: '', text: 'success', cssClass: 'completed' },
            // invalid input
            { mode: 'processing', stage: 'unknown', noResult: true },
            { mode: '', stage: 'running', noResult: true },
        ];

        tests.forEach((test) => {
            if (test.noResult) {
                it(`should not produce a status span with input mode "${test.mode}" and stage "${test.stage}"`, () => {
                    expect(Jobs.createJobStatusFromFsm(test.mode, test.stage)).toBe('');
                });
            } else {
                it(`should output "${test.text}" with input mode "${test.mode}" and stage "${test.stage}"`, () => {
                    container.innerHTML = Jobs.createJobStatusFromFsm(test.mode, test.stage);
                    expect(
                        container.querySelector('[data-element="job-status"]').classList
                    ).toContain(`kb-job-status__cell_summary--${test.cssClass}`);
                    expect(container.querySelector('[data-element="job-status"]').textContent).toBe(
                        test.text
                    );
                });
            }
        });
    });

    describe('createCombinedJobState', () => {
        const batch = 'batch job';
        const tests = [
            {
                desc: 'all jobs queued',
                jobs: [jobsByStatus.created, jobsByStatus.estimating, jobsByStatus.queued],
                expected: `${batch} in progress: 3 queued`,
            },
            {
                desc: 'queued and running jobs',
                jobs: [jobsByStatus.estimating, jobsByStatus.running],
                expected: `${batch} in progress: 1 queued, 1 running`,
            },
            {
                desc: 'all running',
                jobs: [jobsByStatus.running],
                expected: `${batch} in progress: 1 running`,
            },
            {
                desc: 'all jobs',
                jobs: JobsData.allJobs,
                expected: `${batch} in progress: 3 queued, 1 running, 1 success, 2 failed, 2 cancelled, 1 not found`,
            },
            {
                desc: 'in progress and finished',
                jobs: [jobsByStatus.estimating, jobsByStatus.running, jobsByStatus.completed],
                expected: `${batch} in progress: 1 queued, 1 running, 1 success`,
            },
            {
                desc: 'all completed',
                jobs: [jobsByStatus.completed, jobsByStatus.completed, jobsByStatus.completed],
                expected: `${batch} finished with success: 3 successes`,
            },
            {
                desc: 'all failed',
                jobs: [jobsByStatus.error, jobsByStatus.error],
                expected: `${batch} finished with error: 2 failed`,
            },
            {
                desc: 'all terminated',
                jobs: [jobsByStatus.terminated, jobsByStatus.terminated, jobsByStatus.terminated],
                expected: `${batch} finished with cancellation: 3 cancelled`,
            },
            {
                desc: 'mix of finish states',
                jobs: [
                    jobsByStatus.terminated,
                    jobsByStatus.error,
                    jobsByStatus.completed,
                    jobsByStatus.error,
                    jobsByStatus.error,
                ],
                expected: `${batch} finished: 1 success, 3 failed, 1 cancelled`,
            },
            {
                desc: 'in progress, finished, not found',
                jobs: [
                    jobsByStatus.estimating,
                    jobsByStatus.running,
                    jobsByStatus.completed,
                    jobsByStatus.does_not_exist,
                ],
                expected: `${batch} in progress: 1 queued, 1 running, 1 success, 1 not found`,
            },
            {
                desc: 'jobs do not exist',
                jobs: [jobsByStatus.does_not_exist, jobsByStatus.does_not_exist],
                expected: `${batch} finished with error: 2 not found`,
            },
            {
                desc: 'no jobs',
                jobs: [],
                expected: '',
            },
            {
                desc: 'nothing at all',
                jobs: null,
                expected: '',
            },
        ];

        tests.forEach((test) => {
            it(`summarises jobs: ${test.desc}`, () => {
                const div = document.createElement('div');
                div.innerHTML = Jobs.createCombinedJobState(test.jobs);
                expect(div.textContent).toBe(test.expected);
                if (test.expected.length) {
                    expect(div.firstChild.title).toBe(test.expected);
                } else {
                    expect(div.childNodes.length).toBe(0);
                }
            });
        });
    });

    describe('jobArrayToIndexedObject', () => {
        it('creates a model with jobs indexed by ID and by status', () => {
            const model = Jobs.jobArrayToIndexedObject(JobsData.allJobs);
            const idIndex = model.byId,
                statusIndex = model.byStatus;

            const jobStatuses = {};
            expect(Object.keys(idIndex).sort()).toEqual(
                JobsData.allJobs
                    .map((jobState) => {
                        jobStatuses[jobState.status] = 1;
                        return jobState.job_id;
                    })
                    .sort()
            );

            expect(Object.keys(statusIndex).sort()).toEqual(Object.keys(jobStatuses).sort());
        });

        it('creates an empty model with an empty jobs array', () => {
            const model = Jobs.jobArrayToIndexedObject([]);
            expect(model.byId).toEqual({});
            expect(model.byStatus).toEqual({});
        });
    });
});
