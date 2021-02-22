/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define(['KBaseFBA.FBAModel', 'KBModeling'], (Widget) => {
    describe('Test the KBaseFBA.FBAModel widget', () => {
        it('Should load the module', () => {
            const api = new KBModeling('token');
            expect(api.KBaseFBA_FBAModel).toEqual(jasmine.any(Function));
        });
    });
});
