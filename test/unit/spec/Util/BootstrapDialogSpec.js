/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'util/bootstrapDialog'
	], function(
		KBWidget,
		bootstrap,
		$,
		bootstrap
	) {
    var $simpleBody = $('<div>').append('This is a body text');
    var simpleTitle = 'Title';
    var simpleButtons = [
        $('<button>').append('b1')
                     .click(function(event) {

                     }),
        $('<button>').append('b2')
                     .click(function(event) {

                     })
    ];

    var simpleDialog;

    beforeEach(function() {
        simpleDialog = new Dialog({
            title: simpleTitle, 
            body: $simpleBody, 
            buttons: simpleButtons
        });
        // simpleDialog.getElement().appendTo('body');
    });

    describe('Test the BootstrapDialog module', function() {
        it('Should create a new dialog object', function() {
            expect(simpleDialog).toEqual(jasmine.any(Object));
        });

        it('Should show on command', function() {
            simpleDialog.show();
            expect($($.find('.fade.in')).is(':visible')).toBeTruthy();
        });

        it('Should hide on command', function() {
            simpleDialog.show();
            simpleDialog.hide();
            expect($($.find('.modal.fade.in')).is(':visible')).toBeFalsy();
        });

        it('Should get a title string back', function() {
            var title = simpleDialog.getTitle();
            expect(title).toBe(simpleTitle);
        });

        it('Should get the body div back', function() {
            var body = simpleDialog.getBody();
            expect(body.html()).toBe($simpleBody.html());
        });

        it('Should write over the title', function() {
            var newTitle = 'A new title!';
            simpleDialog.setTitle(newTitle);
            expect(simpleDialog.getTitle()).toBe(newTitle);
        });

        it('Should create a new body', function() {
            var $newBody = $('<div>').append('The new body');
            simpleDialog.setBody($newBody);
            expect(simpleDialog.getBody().html()).toBe($newBody.html());
        });
    });
});