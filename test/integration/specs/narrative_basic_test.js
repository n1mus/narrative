/*global describe, it, browser, expect, $, afterEach, beforeEach*/
describe('Narrative tree page with login', () => {
    'use strict';
    const userToken = browser.config.kbaseToken;

    async function setSessionCookies() {
        return await browser.setCookies([{
            name: "kbase_session",
            path: "/",
            value: userToken,
            sameSite: "Lax"
        }]);
    }

    // async version
    it('should open the narrative tree page', async () => {
        await browser.url('/narrative/tree');
        await expect(browser).toHaveTitle('KBase Narrative');
    });

    // each test which needs authentication calls

    it('opens a narrative', async () => {
        // await login();
        browser.debug();
        await browser.url('/narrative/tree');
        await setSessionCookies();
        var cookie = browser.getCookies(['kbase_session']);
        expect(cookie).toBeDefined();
        expect(cookie.value).toEqual(userToken);
        await browser.url('/narrative/31932');
        expect($('nav[id="header"]').isDisplayed()).toBeTruthy();
    });
});
