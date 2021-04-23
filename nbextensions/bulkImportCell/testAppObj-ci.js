define(['./jobsData', 'common/jobs'], (JobsData, Jobs) => {
    'use strict';

    const jobData = JobsData.allJobs;
    const jobRemapping = {
        'job cancelled whilst in the queue': '5ffdc18a06653f3fce3dac53',
        'job running': '6082cb29d1d7027cac486f70',
        'job cancelled during run': '60145f8c6fc98a309e1a27e1',
        'job died with error': '6001e992b1fc2820d22ee7f5',
        'job finished with success': '5ff4dcd6b254b87cbf066b15',
        'job created': '6081930d4be2b75352ccfffe',
        'job estimating': '6081932b1972f3f3f9dddfc7',
        'job in the queue': '6081933d284fabc05c0342ba',
        'job died whilst queueing': '608194db8ce611e702692399',
    };


    const runningJobs = [{ "user": "ialarmedalien", "authstrat": "kbaseworkspace", "wsid": 57559, "status": "running", "updated": 1619184778113, "queued": 1619184767112, "running": 1619184778110, "scheduler_type": "condor", "scheduler_id": "24926", "child_jobs": [], "batch_job": false, "job_id": "6082cc7fd52a8a7fa5ff05c6", "created": 1619184767000, "run_id": "8c3ab6ab-07be-4a01-a771-b871c80c5bb4", "cell_id": "8c3ab6ab-07be-4a01-a771-b871c80c5bb4" },
    { "user": "ialarmedalien", "authstrat": "kbaseworkspace", "wsid": 57559, "status": "running", "updated": 1619184752603, "queued": 1619184745221, "running": 1619184752600, "scheduler_type": "condor", "scheduler_id": "24925", "child_jobs": [], "batch_job": false, "job_id": "6082cc698a111d47bca6e09c", "created": 1619184745000, "job_output": {}, "cell_id": "a885ee0b-c8db-4d2f-ba26-f3356fcbc236", "run_id": "a885ee0b-c8db-4d2f-ba26-f3356fcbc236", "token_id": "43fdee10-f7cd-46cc-a6e4-8d1a64305a4d" }]

    // switch fake job IDs for real ones in narrative
    jobData.forEach((job) => {
        if (jobRemapping[job.job_id]) {
            job.job_id = jobRemapping[job.job_id];
        }
    });

    return {
        exec: {
            jobState: {
                authstrat: 'kbaseworkspace',
                batch_size: jobData.length,
                cell_id: '13395335-1f3d-4e0c-80f7-44b634968da0',
                child_jobs: jobData,
                created: 1607109147000,
                finished: 1607109627617,
                job_id: '5fca8a1bd257f9f38c9862a0',
                job_output: {
                    id: '5fca8a1bd257f9f38c9862a0',
                    result: [
                        {
                            batch_results: jobData.reduce(
                                (acc, curr) => ({
                                    ...acc,
                                    [curr.job_id]: { final_job_state: curr },
                                }),
                                {}
                            ),
                            report_name: 'batch_report_1607109609490',
                            report_ref: '57373/19/1',
                        },
                    ],
                    version: '1.1',
                },
                queued: 1607109147274,
                run_id: '13395335-1f3d-4e0c-80f7-44b634968da0',
                running: 1607109162603,
                scheduler_id: '23203',
                scheduler_type: 'condor',
                status: 'completed',
                updated: 1607109627760,
                user: 'ialarmedalien',
                wsid: 57373,
            },
            jobs: Jobs.jobArrayToIndexedObject(jobData.concat(runningJobs)),
            jobStateUpdated: 1607109635241,
            launchState: {
                cell_id: '13395335-1f3d-4e0c-80f7-44b634968da0',
                event: 'launched_job',
                event_at: '2020-12-04T19:12:27.690847Z',
                job_id: '5fca8a1bd257f9f38c9862a0',
                run_id: '8c202a66-e868-4cf4-a990-bab2393985ae',
            },
            outputWidgetInfo: {
                name: 'no-display',
                params: {
                    report_name: 'batch_report_1607109609490',
                    report_ref: '57373/19/1',
                },
                tag: 'dev',
            },
        },
    };
});
