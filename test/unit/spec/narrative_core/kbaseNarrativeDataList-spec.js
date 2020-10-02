/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'kbaseNarrativeDataList',
    'jquery',
    'narrativeConfig',
    'kb_service/client/workspace',
    'base/js/namespace'
], function(DataList, $, Config, Workspace, Jupyter) {
    'use strict';

    beforeEach(() => {
        jasmine.Ajax.install();
        Jupyter.narrative = {
            getAuthToken: () => 'someToken',
            getWorkspaceName: () => 'someWorkspace'
        };
    });

    afterEach(() => {
        jasmine.Ajax.uninstall();
    });

    describe('Test the kbaseNarrativeDataList widget', () => {
        // mock Workspace.get_workspace_info
        // mock service wizard
        // mock NarrativeService.list_objects_with_sets
        it('Should instantiate itself', async () => {

            const fakeNSUrl = 'https://ci.kbase.us/services/fake_url';
            const narrativeServiceInfo = {
                version: '1.1',
                id: '12345',
                result: [{
                    git_commit_hash: 'foo',
                    hash: 'bar',
                    health: 'healthy',
                    module_name: 'SampleService',
                    url: fakeNSUrl
                }]
            };

            jasmine.Ajax.stubRequest(Config.url('service_wizard')).andReturn({
                status: 200,
                statusText: 'HTTP/1/1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify(narrativeServiceInfo)
            });

            jasmine.Ajax.stubRequest(fakeNSUrl).andReturn({
                status: 200,
                statusText: 'HTTP/1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    version: '1.1',
                    id: '12345',
                    result: [{
                        data: [],
                        data_palette_refs: {}
                    }]
                })
            });

            jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [[
                        35855,
                        'wjriehl:narrative_1534979778065',
                        'wjriehl',
                        '2020-09-30T23:22:25+0000',
                        2,
                        'a',
                        'n',
                        'unlocked',
                        {
                            'narrative_nice_name': 'CI Scratch',
                            'searchtags': 'narrative',
                            'is_temporary': 'false',
                            'narrative': '1'
                        }
                    ]]
                })
            });

            const $div = $('<div>');
            const dl = new DataList($div, {});
            expect(dl).toBeDefined();
            dl.ws_name = 'some_workspace';
            dl.ws = new Workspace(Config.url('workspace'), null);
            await dl.refresh();
            console.log($div);
        });
    });
});
