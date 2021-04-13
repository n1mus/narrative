define(['./jobsData', 'json!./testAppObj-prod.json'], (JobsData, ProdTestAppObj) => {
    'use strict';

    function generate() {
        const jobData = JobsData.allJobs;
        const jobRemapping = {
            'job cancelled whilst in the queue': '6071b90acdf16d2d16260b34',
            'job cancelled during run': '6072fa3abdaed71883f702cf',
            'job died with error': '6072fa25eeb773acaf9df397',
            'job finished with success': '6072f9a6d9eade396406283e',
        };

        // switch fake job IDs for real ones in narrative
        jobData.forEach((job) => {
            if (jobRemapping[job.job_id]) {
                job.job_id = jobRemapping[job.job_id];
            }
        });

        ProdTestAppObj.exec.jobState.child_jobs = ProdTestAppObj.exec.jobState.child_jobs.concat(
            jobData
        );
        ProdTestAppObj.exec.jobState.batch_size = ProdTestAppObj.exec.jobState.child_jobs.length;

        const batchResults = jobData.reduce(
            (acc, curr) => ({
                ...acc,
                [curr.job_id]: { final_job_state: curr },
            }),
            {}
        );

        Object.keys(batchResults).forEach((result) => {
            ProdTestAppObj.exec.jobState.job_output.result[0].batch_results[result] =
                batchResults[result];
        });

        return ProdTestAppObj;
    }

    return { generate };
});
