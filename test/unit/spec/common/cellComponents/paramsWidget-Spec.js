/*global describe, it, expect*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define([
    'common/cellComponents/paramsWidget',
    'common/runtime',
    'common/ui'
], function(
    ParamsWidget,
    Runtime,
    UI
) {
    'use strict';

    describe('The Parameter module', function() {
        it('loads', function() {
            expect(ParamsWidget).not.toBe(null);
        });

        it('has expected functions', function() {
            expect(ParamsWidget.make).toBeDefined();
        });
    });

    describe('The Parameter instance', function() {
        const workspaceInfo = {
            globalread: 'n',
            id: 54745,
            lockstat: 'unlocked',
            metadata: {
                cell_count: '1',
                narrative_nice_name: 'Test Narrative',
                searchtags: 'narrative',
                is_temporary: 'false',
                narrative: '1'
            },
            moddate: '2020-10-06T03:30:52+0000',
            name: 'testUser:narrative_1601948894239',
            object_count: 1,
            owner: 'testUser',
            user_permission: 'a'
        };

        const model = {
            getItem: (item) => model[item],
            setItem: (item, data) => model[item] = data,
            'params': {
                'import_type': 'SRA'
            },
            'app.spec': {
                'full_info' : {
                    'description': 'Details about this mock app'
                },
                'info': {
                    'authors': ['Abraham', 'Martin', 'John'],
                    'id': 0,
                    'subtitle': 'A mock app for testing purposes',
                    'ver': '1.0.1',
                },
                'parameters': [{
                    'text_options': {
                        'valid_ws_types': ['KBaseRNASeq.RNASeqSampleSet']},
                    'ui_name': 'RNA sequence object <font color=red>*</font>',
                }, {
                    'ui_name': 'Adapters',
                }],
            },
            'executionStats': {
                'number_of_calls': 1729,
                'total_exec_time': 9001,
            },
        };

        //what to test? regular param, file with dropdown_options -> source = staging, output
        //can we test advanced and hidden params?
        const parameters = {
            layout: ['import_type'],
            specs: {
                //normal parameter, not advanced, should display
                'import_type': {
                    id: 'import_type',
                    multipleItems: false,
                    original: {
                        advanced: 0,
                        allow_multiple: 0,
                        default_values: ['FASTQ/FASTA'],
                        description: 'Import file type ["FASTQ/FASTA" or "SRA"]',
                        disabled: 0,
                        dropdown_options: {
                            multiselection: 0,
                            options: [
                                {
                                    display: 'FASTQ/FASTA',
                                    index: 0,
                                    value: 'FASTQ/FASTA'
                                },
                                {
                                    display: 'SRA',
                                    index: 1,
                                    value: 'SRA'
                                }
                            ]
                        },
                        field_type: 'dropdown',
                        id: 'import_type',
                        optional: 0,
                        short_hint: 'Import file type ["FASTQ/FASTA" or "SRA"]',
                        ui_class: 'parameter',
                        ui_name: 'Import File Type'
                    },
                    data: {
                        constraints: {
                            options: [
                                {
                                    display: 'FASTQ/FASTA',
                                    index: 0,
                                    value: 'FASTQ/FASTA'
                                },
                                {
                                    display: 'SRA',
                                    index: 1,
                                    value: 'SRA'
                                }
                            ],
                            required: true
                        },
                        defaultValue: 'FASTQ/FASTA',
                        nullValue: '',
                        sequence: false,
                        type: 'string'
                    },
                    ui: {
                        advanced: false,
                        class: 'parameter',
                        control: 'dropdown',
                        description: 'Import file type ["FASTQ/FASTA" or "SRA"]',
                        hint: 'Import file type ["FASTQ/FASTA" or "SRA"]',
                        label: 'Import File Type',
                        type: 'dropdown'
                    },
                    _position: 0
                }
            }
        };

        let mockParamsWidget;

        beforeEach(async function () {
            const appSpec = model.getItem('app.spec');
            const initialParams = model.getItem('params');
            let bus = Runtime.make().bus();

            let container = document.createElement('div');
            UI.make({
                node: container,
                bus: bus
            });

            let paramNode = document.createElement('div');

            container.appendChild(paramNode);

            mockParamsWidget = ParamsWidget.make({
                bus: bus,
                workspaceInfo: workspaceInfo,
                initialParams: initialParams
            });

            await mockParamsWidget.start({
                node: paramNode,
                appSpec: appSpec,
                parameters: parameters
            });
        });

        it('has a factory which can be invoked', function() {
            expect(mockParamsWidget).not.toBe(null);
        });

        it('has the required methods', function() {
            expect(mockParamsWidget.start).toBeDefined();
            expect(mockParamsWidget.stop).toBeDefined();
        });
    });
});
