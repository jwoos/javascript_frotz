'use strict';

const DFrotzInterface = require('../index');

const fs = require('fs');
const q = require('q');
const childProcess = require('child_process');

const colors = require('colors');

const util = {
    expectList: (obj, props) => {
    }
};

colors.setTheme({
    warn: 'yellow',
    error: 'red',
    debug: 'blue'
});

describe('Class: DFrotzInterface', () => {
    describe('Method: constructor', () => {
        it('should set options by default', () => {
            let frotz = new DFrotzInterface();

            /*
             *util.expectList(frotz, {
             *    executable: ['equal', './frotz']
             *});
             */

            expect(frotz.executable).toEqual('./frotz/dfrotz');
            expect(frotz.gameImage).toEqual('./frotz/data/zork1/DATA/ZORK1.DAT');
            expect(frotz.saveFile).toEqual('./frotz/data/zork1/SAVE/zork1.sav');
            expect(frotz.outputFilter).toEqual(DFrotzInterface.filter);
            expect(frotz.dropAll).toEqual(true);
        });

        it('should take in options to override defaults', () => {
            let mockFilter = () => {};
            let frotz = new DFrotzInterface({
				executable: 'test/executable',
				gameImage: 'test/gameImage',
				saveFile: 'test/save',
				outputFilter: mockFilter
			});

            expect(frotz.executable).toEqual('test/executable');
            expect(frotz.gameImage).toEqual('test/gameImage');
            expect(frotz.saveFile).toEqual('test/save');
            expect(frotz.outputFilter).toEqual(mockFilter);
            expect(frotz.dropAll).toEqual(true);
        });
    });

    describe('Method: filter', () => {
		it('should filter string starting with >', () => {
			let arr = [
				'first',
				'second',
				'>third',
			];

			let result = arr.filter(DFrotzInterface.filter);

			expect(result).toEqual([
				'first',
				'second'
			]);
		});

		it('should filter out empty strings', () => {
			let arr = [
				'',
				'',
				'',
				''
			];

			expect(arr.filter(DFrotzInterface.filter)).toEqual([]);
		});

		it('should keep the first elem if length is three', () => {
			let arr = [
				'first',
				'',
				''
			];

			expect(arr.filter(DFrotzInterface.filter)).toEqual([
				'first'
			]);
		});
	});

	describe('Method: stripWhiteSpace', () => {
		it('should strip whitespace', () => {
			let str = '  asdasd    asdasd qeq';

			let result = DFrotzInterface.stripWhiteSpace(str, true, true);

			expect(result).toEqual('asdasd | asdasd qeq');
		});

		it('should do nothing if no arguments are specified', () => {
			let str = '               asd ';
			let result = DFrotzInterface.stripWhiteSpace(str);

			expect(str).toEqual(result);
		});

		it('should only do outer', () => {
			let str = '   asd   asd   ';
			let result = DFrotzInterface.stripWhiteSpace(str, false, true);

			expect(result).toEqual('asd   asd');
		});
	});

    describe('Method: command', () => {
		let frotz;
		let mockDefer;

		beforeEach(() => {
			frotz = new DFrotzInterface();
			frotz.dfrotz = {
				stdin: {
					write: () => {}
				}
			};

			mockDefer = q.defer();

			spyOn(frotz.dfrotz.stdin, 'write');
		});

		it('should write to stdin', () => {
			frotz.command('a command');

			expect(frotz.dfrotz.stdin.write).toHaveBeenCalled();
		});

		it('should work with promises', () => {
			spyOn(q, 'defer').and.returnValues(mockDefer);
			spyOn(mockDefer.promise, 'delay').and.callThrough();

			let result = frotz.command('command');

			expect(mockDefer.promise.delay).toHaveBeenCalledWith(10);
		});
	});

	describe('Method: checkForSaveFile', () => {
		let frotz;

		beforeEach(() => {
			frotz = new DFrotzInterface();
		});

		it('should return a promise', () => {
			expect(frotz.checkForSaveFile().then).not.toBeNull();
		});

		it('should always resolve', () => {
			frotz.checkForSaveFile().then((val) => {
				expect(val).toEqual(false);
			});

			frotz.saveFile = './';

			frotz.checkForSaveFile().then((val) => {
				expect(val).toEqual(true);
			});
		});
	});

	describe('Method: restoreSave', () => {
		let frotz;

		beforeEach(() => {
			frotz = new DFrotzInterface();
			frotz.saveFile = './';

			spyOn(frotz, 'command');
			spyOn(q, 'all').and.callThrough();
		});

		it('should call restore', () => {
			frotz.restoreSave(true);

			expect(frotz.command).toHaveBeenCalledTimes(2);
			expect(frotz.command).toHaveBeenCalledWith('restore');
			expect(frotz.command).toHaveBeenCalledWith('./');
		});

		it('should return a promise', () => {
			let result = frotz.restoreSave();

			expect(result.then).not.toBeNull();
		});

		it('should consolidate promises', () => {
			frotz.restoreSave();

			expect(q.all).toHaveBeenCalled();
		});
	});

	describe('Method: writeSave', () => {
		let frotz;

		beforeEach(() => {
			frotz = new DFrotzInterface();
			frotz.saveFile = './';

			spyOn(frotz, 'command');
			spyOn(q, 'all').and.callThrough();
		});

		it('should return a promise', () => {
			let result = frotz.writeSave();

			expect(result.then).not.toBeNull();
		});

		it('should call commands', () => {
			frotz.writeSave();

			expect(frotz.command).toHaveBeenCalledTimes(6);

			for (let cmd of ['save', './', 'Y', 'quit', 'Y', 'SI']) {
				expect(frotz.command).toHaveBeenCalledWith(cmd);
			}
		});

		it('should consolidate promises', () => {
			frotz.writeSave();

			expect(q.all).toHaveBeenCalled();
		});
	});

    describe('Method: iteration', () => {});
});
