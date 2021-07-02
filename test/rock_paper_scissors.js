const RockPaperScissors = artifacts.require("RockPaperScissors");
const {
	expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");
const { assertion } = require("@openzeppelin/test-helpers/src/expectRevert");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const BN = web3.utils.BN;

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("RockPaperScissors", function (accounts) {
	const [player1, player2, player3, _] = accounts;
	beforeEach(async function () {
		this.rockPaperScissors = await RockPaperScissors.new();
	});
	describe("registration", () => {
		it("should able to registered ", async function () {
			const amount = new BN(web3.utils.toWei("2"));
			await this.rockPaperScissors.register({ from: player1, value: amount });
			let contractBalance = await this.rockPaperScissors.getContractBalance();
			assert.equal(amount.toString(), contractBalance.toString());
			await this.rockPaperScissors.register({ from: player2, value: amount });
			contractBalance = await this.rockPaperScissors.getContractBalance();
			assert.equal(amount.add(amount).toString(), contractBalance.toString());
		});
		it("should not  able to registered if less than min bet", async function () {
			const bet_MIN = await this.rockPaperScissors.BET_MIN();
			assert.equal(parseInt(bet_MIN), 1000000000000000); //1 finney =1000000000000000 wei
			const amount = new BN(web3.utils.toWei("0.0001")); //0.1 finney
			expectRevert.unspecified(this.rockPaperScissors.register({ from: player1, value: amount }));
			//contract balance must be zero ,user didn't registered here
			let contractBalance = await this.rockPaperScissors.getContractBalance();
			assert.equal(0, contractBalance);
			expectRevert.unspecified(this.rockPaperScissors.register({ from: player2, value: amount }));
			contractBalance = await this.rockPaperScissors.getContractBalance();
			assert.equal(0, contractBalance);
		});
		it("should not  able to registered if 3rd person wan't to register", async function () {
			const amount = new BN(web3.utils.toWei("2"));
			await this.rockPaperScissors.register({ from: player1, value: amount });
			let contractBalance = await this.rockPaperScissors.getContractBalance();
			assert.equal(amount.toString(), contractBalance.toString());
			await this.rockPaperScissors.register({ from: player2, value: amount });
			contractBalance = await this.rockPaperScissors.getContractBalance();
			assert.equal(amount.add(amount).toString(), contractBalance.toString());
			expectRevert.unspecified(this.rockPaperScissors.register({ from: player3, value: amount }));
		});
	});

	describe("After registration", async function () {
		beforeEach(async function () {
			this.amount = new BN(web3.utils.toWei("1"));
			await this.rockPaperScissors.register({ from: player1, value: this.amount });
			await this.rockPaperScissors.register({ from: player2, value: this.amount });
			this.encryptedPlayer1Move = await this.rockPaperScissors.getHash("1-lithium");
			this.encryptedPlayer2Move = await this.rockPaperScissors.getHash("2-lithiumOther");
		});

		it("Should able to  play ", async function () {
			let bothPlayed = await this.rockPaperScissors.bothPlayed();
			//Before  player played their move
			assert.equal(bothPlayed, false);
			await this.rockPaperScissors.play(this.encryptedPlayer1Move, { from: player1 });
			await this.rockPaperScissors.play(this.encryptedPlayer2Move, { from: player2 });
			bothPlayed = await this.rockPaperScissors.bothPlayed();
			//Both player played their move
			assert.equal(bothPlayed, true);
		});
		it("Should not able to  play without registration", async function () {
			const encryptedPlayer3Move = await this.rockPaperScissors.getHash("3-lithiumOtherOthers");
			expectRevert.unspecified(this.rockPaperScissors.play(encryptedPlayer3Move, { from: player3 }));
		});
		describe("Revealation", async function () {
			beforeEach(async function () {
				await this.rockPaperScissors.play(this.encryptedPlayer1Move, { from: player1 });
				await this.rockPaperScissors.play(this.encryptedPlayer2Move, { from: player2 });
			});
			it("Should able to  Reveal their move  ", async function () {
				bothPlayed = await this.rockPaperScissors.bothPlayed();
				//Both player played their move
				assert.equal(bothPlayed, true);
				await this.rockPaperScissors.reveal("1-lithium", { from: player1 });
				await this.rockPaperScissors.reveal("2-lithiumOther", { from: player2 });
				const bothRevealed = await this.rockPaperScissors.bothRevealed();
				assert.equal(bothRevealed, true);
			});
			it("Should not able to  reveal without registration", async function () {
				const encryptedPlayer3Move = await this.rockPaperScissors.getHash("3-lithiumOtherOthers");
				expectRevert.unspecified(this.rockPaperScissors.reveal(encryptedPlayer3Move, { from: player3 }));
			});
			describe("Getting results", async function () {
				beforeEach(async function () {
					await this.rockPaperScissors.reveal("1-lithium", { from: player1 });
					await this.rockPaperScissors.reveal("2-lithiumOther", { from: player2 });
				});
				it("getting Outcome ", async function () {
					// player1 play rock and player2 play paper
					//Anyone can call getOutcome()
					const ethBeforePlayer1 = await web3.eth.getBalance(player1);
					const ethBeforePlayer2 = await web3.eth.getBalance(player2);
					await this.rockPaperScissors.getOutcome({ from: player3 });
					const ethAfterPlayer1 = await web3.eth.getBalance(player1);
					const ethAfterPlayer2 = await web3.eth.getBalance(player2);
					assert.equal(ethBeforePlayer1, ethAfterPlayer1);
					assert.equal((ethAfterPlayer2 - ethBeforePlayer2).toString(), this.amount.add(this.amount).toString());
				});
			});
		});
	});
});
