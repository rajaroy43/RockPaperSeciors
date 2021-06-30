const RockPaperScissors = artifacts.require("RockPaperScissors");

module.exports = function (deployer) {
	const fomoPoolAddress = "0xb7bb1792BBfabbA361c46DC5860940e0E1bFb4b9";
	deployer.deploy(RockPaperScissors, fomoPoolAddress);
};
