/*global describe, it, browser, expect, $, afterEach, beforeEach*/
describe('Narrative tree page with login', () => {
    'use strict';
    // const userToken = browser.config.kbaseToken;

    // async version
    it('should open the narrative tree page', async () => {
        await browser.url('/narrative/tree');
        await expect(browser).toHaveTitle('KBase Narrative');
    });

    // it('opens a narrative', async () => {
    //     await browser.url('/narrative/tree');
    //     await browser.setCookies({name: 'kbase_session', value: userToken});
    //     expect(browser.getCookies(['kbase_session'])[0].value).toBe(userToken);
    //     await browser.url('/narrative/31932');

    //     expect(browser.getCookies(['kbase_session'])[0].value).toBe(userToken);
    //     browser.pause(100000);
    //     $('span*=ProkkaTest').click();
    //     browser.switchWindow('/narrative/notebooks/ws.31932.obj.1');
    //     expect($('nav[id="header"]').isDisplayed()).toBeTruthy();
    // });
});
