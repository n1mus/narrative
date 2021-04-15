define(['common/format'], (format) => {
    'use strict';
    const t = {
        created: 1610065000000,
        queued: 1610065200000,
        running: 1610065500000,
        finished: 1610065800000,
    };

    const jobStrings = {
        unknown: 'Determining job state...',
        not_found: 'This job was not found, or may not have been registered with this narrative.',
        queued: 'In the queue since ' + format.niceTime(t.created),
        termination: 'Finished with cancellation at ' + format.niceTime(t.finished),
        running: 'Started running job at ' + format.niceTime(t.running),
        error: 'Finished with error at ' + format.niceTime(t.finished),
        success: 'Finished with success at ' + format.niceTime(t.finished),
        queueHistory: 'Queued for ' + format.niceDuration(t.running - t.created),
        queueHistoryNoRun: 'Queued for ' + format.niceDuration(t.finished - t.created),
        runHistory: 'Ran for ' + format.niceDuration(t.finished - t.running),
        action: {
            results: 'go to results',
            cancel: 'cancel',
            retry: 'retry',
        },
    };

    /*
        The following are valid job state objects as would be received from ee2.

        The `meta` key can be used to store test-related data about the job states, such as the expected return from various functions. It is suggested these are indexed by the function name.

    */

    const validJobs = [
        {
            job_id: 'job created',
            status: 'created',
            created: t.created,
            updated: t.created,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.queued,
                    history: [jobStrings.queued],
                },
                jobAction: jobStrings.action.cancel,
                jobLabel: 'queued',
                niceState: {
                    class: 'kb-job-status__summary',
                    label: 'created',
                },
                appCellFsm: { mode: 'processing', stage: 'queued' },
                logViewerFsm: { mode: 'queued' },
            },
        },
        {
            job_id: 'job estimating',
            status: 'estimating',
            created: t.created,
            updated: t.created,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.queued,
                    history: [jobStrings.queued],
                },
                jobAction: jobStrings.action.cancel,
                jobLabel: 'queued',
                niceState: {
                    class: 'kb-job-status__summary',
                    label: 'estimating',
                },
                appCellFsm: { mode: 'processing', stage: 'queued' },
                logViewerFsm: { mode: 'queued' },
            },
        },
        {
            job_id: 'job in the queue',
            status: 'queued',
            created: t.created,
            queued: t.queued,
            updated: 12345678910,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.queued,
                    history: [jobStrings.queued],
                },
                jobAction: jobStrings.action.cancel,
                jobLabel: 'queued',
                niceState: {
                    class: 'kb-job-status__summary',
                    label: 'queued',
                },
                appCellFsm: { mode: 'processing', stage: 'queued' },
                logViewerFsm: { mode: 'queued' },
            },
        },
        {
            job_id: 'job cancelled whilst in the queue',
            status: 'terminated',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            updated: 12345678910,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.termination,
                    history: [jobStrings.queueHistoryNoRun, jobStrings.termination],
                },
                jobAction: jobStrings.action.retry,
                jobLabel: 'cancelled',
                niceState: {
                    class: 'kb-job-status__summary--terminated',
                    label: 'cancellation',
                },
                appCellFsm: { mode: 'canceled' },
                logViewerFsm: { mode: 'terminated' },
            },
        },
        {
            job_id: 'job running',
            status: 'running',
            created: t.created,
            queued: t.queued,
            running: t.running,
            updated: 12345678910,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.running,
                    history: [jobStrings.queueHistory, jobStrings.running],
                },
                jobAction: jobStrings.action.cancel,
                jobLabel: 'running',
                niceState: {
                    class: 'kb-job-status__summary',
                    label: 'running',
                },
                appCellFsm: { mode: 'processing', stage: 'running' },
                logViewerFsm: { mode: 'running' },
            },
        },
        {
            job_id: 'job cancelled during run',
            status: 'terminated',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            running: t.running,
            updated: 12345678910,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.termination,
                    history: [
                        jobStrings.queueHistory,
                        jobStrings.runHistory,
                        jobStrings.termination,
                    ],
                },
                jobAction: jobStrings.action.retry,
                jobLabel: 'cancelled',
                niceState: {
                    class: 'kb-job-status__summary--terminated',
                    label: 'cancellation',
                },
                appCellFsm: { mode: 'canceled' },
                logViewerFsm: { mode: 'terminated' },
            },
        },
        {
            job_id: 'job died whilst queueing',
            status: 'error',
            error: {
                code: 666,
                name: 'Queue error',
                message: 'Job died in the queue',
            },
            error_code: 1,
            errormsg: 'Job did not know how to queue!',
            created: t.created,
            queued: t.queued,
            finished: t.finished,
            updated: 12345678910,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.error,
                    history: [jobStrings.queueHistoryNoRun, jobStrings.error],
                },
                jobAction: jobStrings.action.retry,
                jobLabelIncludeError: 'failed: Queue error',
                jobLabel: 'failed',
                niceState: {
                    class: 'kb-job-status__summary--error',
                    label: 'error',
                },
                errorString: 'Queue error: Error code: 666',
                appCellFsm: { mode: 'error', stage: 'queued' },
                logViewerFsm: { mode: 'error' },
            },
        },
        {
            job_id: 'job died with error',
            status: 'error',
            error: {
                code: -32000,
                name: 'Server error',
                message: 'App woke up from its nap very cranky!',
            },
            error_code: 1,
            errormsg: 'Job output contains an error',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            running: t.running,
            updated: 12345678910,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.error,
                    history: [jobStrings.queueHistory, jobStrings.runHistory, jobStrings.error],
                },
                jobAction: jobStrings.action.retry,
                jobLabelIncludeError: 'failed: Server error',
                jobLabel: 'failed',
                niceState: {
                    class: 'kb-job-status__summary--error',
                    label: 'error',
                },
                errorString: 'Server error: Error code: -32000',
                appCellFsm: { mode: 'error', stage: 'running' },
                logViewerFsm: { mode: 'error' },
            },
        },
        {
            job_id: 'job finished with success',
            status: 'completed',
            created: t.created,
            finished: t.finished,
            queued: t.queued,
            running: t.running,
            updated: 12345678910,
            meta: {
                createJobStatusLines: {
                    line: jobStrings.success,
                    history: [jobStrings.queueHistory, jobStrings.runHistory, jobStrings.success],
                },
                jobAction: jobStrings.action.results,
                jobLabel: 'success',
                niceState: {
                    class: 'kb-job-status__summary--completed',
                    label: 'success',
                },
                appCellFsm: { mode: 'success' },
                logViewerFsm: { mode: 'completed' },
            },
            result: [
                {
                    report_name: 'kb_megahit_report_33c8f76d-0aaa-4b27-a0f9-4569b69fef3e',
                    report_ref: '57373/16/1',
                },
            ],
        },
    ];

    // the 'does_not_exist' job state is created by the narrative backend
    const unknownJob = {
        job_id: 'unknown job',
        status: 'does_not_exist',
        created: t.created,
        other: 'key',
        another: 'key',
        meta: {
            createJobStatusLines: {
                line: jobStrings.not_found,
                history: [jobStrings.not_found],
            },
            jobAction: jobStrings.action.retry,
            jobLabel: 'not found',
            niceState: {
                class: 'kb-job-status__summary--does_not_exist',
                label: 'does not exist',
            },
            logViewerFsm: { mode: 'does_not_exist' },
        },
    };

    const invalidJobs = [
        1,
        'foo',
        ['a', 'list'],
        {
            job_id: 'somejob',
            other: 'key',
        },
        {
            created: 'at_some_point',
            other: 'key',
        },
        {
            job_id: 'baz',
            create: 12345,
        },
        {
            job_id: 'whatever',
            status: 'running',
        },
        {
            job_id: 'no job status',
            created: 12345678,
            status: 'who cares?',
        },
        null,
        undefined,
    ];

    const validInfo = [
        {
            job_params: [{ this: 'that' }],
            job_id: 'job_with_single_param',
            app_id: 'NarrativeTest/app_sleep',
            app_name: 'App Sleep',
        },
        {
            job_params: [{ tag_two: 'value two', tag_three: 'value three' }],
            job_id: 'job_with_multiple_params',
        },
    ];

    const invalidInfo = [
        null,
        undefined,
        {},
        ['job_id'],
        { job_id: 12345, params: [{ hello: 'world' }] },
        { job_id: 12345, job_params: {} },
        { job_id: 12345, job_params: [] },
        { job_id: 12345, job_params: ['hello world'] },
        { job_id: 12345, job_params: [['hello world']] },
        { job_id: 12345, job_params: [{}] },
        { job_params: [{ this: 'that' }] },
    ];

    return {
        validJobs: validJobs,
        invalidJobs: invalidJobs,
        unknownJob: unknownJob,
        allJobs: [...validJobs, unknownJob],
        jobStrings: jobStrings,
        validInfo: validInfo,
        invalidInfo: invalidInfo,
    };
});
