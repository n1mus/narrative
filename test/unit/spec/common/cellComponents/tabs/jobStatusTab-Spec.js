define([
    'common/cellComponents/tabs/jobStatus/jobStatusTab',
    'common/cellComponents/tabs/jobStatus/jobStateList',
    'common/props',
    '/test/data/testAppObj',
], (JobStatusTab, JobStateList, Props, TestAppObject) => {
    'use strict';

    const model = Props.make({
        data: TestAppObject,
        onUpdate: () => {},
    });
    const jobTabContainerClass = 'kb-job__tab_container';

    describe('The job status tab module', () => {
        it('loads', () => {
            expect(JobStatusTab).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(JobStatusTab.make).toBeDefined();
            expect(JobStatusTab.make).toEqual(jasmine.any(Function));
        });
    });

    describe('The job status tab instance', () => {
        let container;
        beforeEach(function () {
            container = document.createElement('div');
            this.jobStatusTabInstance = JobStatusTab.make({
                model: model,
                jobManager: {},
            });
        });

        afterEach(() => {
            container.remove();
        });

        it('has a make function that returns an object', function () {
            expect(this.jobStatusTabInstance).not.toBe(null);
            expect(this.jobStatusTabInstance).toEqual(jasmine.any(Object));
        });

        it('has the required methods', function () {
            ['start', 'stop'].forEach((fn) => {
                expect(this.jobStatusTabInstance[fn]).toBeDefined();
                expect(this.jobStatusTabInstance[fn]).toEqual(jasmine.any(Function));
            }, this);
        });

        it('should start the job status tab widget', async function () {
            expect(container.classList.length).toBe(0);
            spyOn(JobStateList, 'make').and.callThrough();
            await this.jobStatusTabInstance.start({ node: container });

            expect(container).toHaveClass(jobTabContainerClass);
            expect(container.childNodes.length).toBe(1);

            const [firstChild] = container.childNodes;
            expect(firstChild).toHaveClass('kb-job__container');
            expect(firstChild.getAttribute('data-element')).toEqual('kb-job-list-wrapper');

            expect(JobStateList.make).toHaveBeenCalled();
        });

        it('should stop when requested to', async function () {
            expect(container.classList.length).toBe(0);
            spyOn(JobStateList, 'make').and.callThrough();

            await this.jobStatusTabInstance.start({ node: container });
            expect(container).toHaveClass(jobTabContainerClass);
            expect(JobStateList.make).toHaveBeenCalled();

            await this.jobStatusTabInstance.stop();
            expect(container.innerHTML).toBe('');
        });
    });
});
