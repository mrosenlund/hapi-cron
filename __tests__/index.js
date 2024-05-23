/*********************************************************************************
 1. Dependencies
 *********************************************************************************/

const HapiCron = require('../lib');
const Hapi = require('@hapi/hapi');


/*********************************************************************************
 2. Exports
 *********************************************************************************/

describe('registration assertions', () => {

    it('should register plugin without errors', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron
        });
    });

    it('should throw error when a job is defined with an existing name', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testname',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }, {
                        name: 'testname',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Job name has already been defined');
        }
    });

    it('should throw error when a job is defined without a name', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job name');
        }
    });

    it('should throw error when a job is defined without a time', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job time');
        }
    });

    it('should throw error when a job is defined with an invalid time', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: 'invalid cron',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Time is not a cron expression');
        }
    });

    it('should throw error when a job is defined with an invalid timezone', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'invalid',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Invalid timezone. See https://momentjs.com/timezone for valid timezones');
        }
    });

    it('should throw error when a job is defined without a timezone', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job time zone');
        }
    });

    it('should throw error when a job is defined without a url in the request object', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            method: 'GET'
                        }
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job request url');
        }
    });

    it('should throw error when a job is defined with an invalid onComplete value', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            method: 'GET',
                            url: '/test-url'
                        },
                        onComplete: 'invalid'
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('onComplete value must be a function');
        }
    });

    it('should throw error when a job is defined without a request or execute option', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London'
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Missing job request options or execute function');
        }
    });

    it('should register a job with the execute option without errors', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testExecute',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    execute: async () => {

                        return await 'Execution successful';
                    }
                }]
            }
        });

        expect(server.plugins['hapi-cron']).toBeDefined();
        expect(server.plugins['hapi-cron'].jobs.testExecute).toBeDefined();
    });

    it('should throw error when a job is defined with an invalid execute value', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({
                plugin: HapiCron,
                options: {
                    jobs: [{
                        name: 'testExecute',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        execute: 'invalid'
                    }]
                }
            });
        }
        catch (err) {
            expect(err.message).toEqual('Execute value must be a function');
        }
    });
});

describe('plugin functionality', () => {

    it('should expose access to the registered jobs', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });

        expect(server.plugins['hapi-cron']).toBeDefined();
        expect(server.plugins['hapi-cron'].jobs.testcron).toBeDefined();
    });

    it('should ensure the request and callback from the plugin options are triggered', async (done) => {

        const onComplete = jest.fn();
        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    },
                    onComplete
                }]
            }
        });

        server.route({
            method: 'GET',
            path: '/test-url',
            handler: () => 'hello world'
        });

        server.events.on('response', (request) => {

            expect(request.method).toBe('get');
            expect(request.path).toBe('/test-url');
            done();
        });

        expect(onComplete).not.toHaveBeenCalled();

        await server.plugins['hapi-cron'].jobs.testcron._callbacks[0]();

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith('hello world');
    });

    it('should not start the jobs until the server starts', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });

        expect(server.plugins['hapi-cron'].jobs.testcron.running).toBeUndefined();

        await server.start();

        expect(server.plugins['hapi-cron'].jobs.testcron.running).toBe(true);

        await server.stop();
    });

    it('should stop cron jobs when the server stops', async () => {

        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        });

        await server.start();

        expect(server.plugins['hapi-cron'].jobs.testcron.running).toBe(true);

        await server.stop();

        expect(server.plugins['hapi-cron'].jobs.testcron.running).toBe(false);
    });

    it('should ensure the execute function is called and onComplete callback is triggered', async (done) => {

        const onComplete = jest.fn();
        const server = new Hapi.Server();

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testExecute',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    execute: async () => {

                        return await 'Execution successful';
                    },
                    onComplete
                }]
            }
        });

        expect(onComplete).not.toHaveBeenCalled();

        await server.plugins['hapi-cron'].jobs.testExecute._callbacks[0]();

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith('Execution successful');
        done();
    });

    it('should ensure the execute function is called without onComplete callback', async (done) => {

        const server = new Hapi.Server();

        const executeFunction =  jest.fn(async () => {

            return await 'Executed without onComplete';
        });

        await server.register({
            plugin: HapiCron,
            options: {
                jobs: [{
                    name: 'testExecuteWithoutOnComplete',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    execute: await executeFunction
                }]
            }
        });

        expect(executeFunction).not.toHaveBeenCalled();

        // Manually trigger the job
        await server.plugins['hapi-cron'].jobs.testExecuteWithoutOnComplete._callbacks[0]();

        expect(executeFunction).toHaveBeenCalledTimes(1);
        done();
    });
});
