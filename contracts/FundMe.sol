//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "contracts/PriceConverter.sol";

//Update all global variables with storage prefixes i.e i_, s_
//Then complete the storage challenge on github page 


//Creates a custom error to save gas on the contract
error FundMe__NotOwner();

/** @title A contract for crowd funding
* @author Jamison Golson
* @notice This contract is to demo a sample funding contract
* @dev This contract implemets price feeds as our libraries
*/
contract FundMe{ 

    /* 
        Inside each contract, library or interface, use the following order:
        1. Type declarations
        2. State variables
        3. Events
        4. Modifiers
        5. Functions
    */

    using PriceConverter for uint256;

    //State variables 
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    //Array to hold the address of every person that sent funds to this contract
    address[] private s_funders; 
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner; 
    AggregatorV3Interface private s_priceFeed;

    //Modifiers
    modifier onlyOwner{
        //require(msg.sender == i_owner, "Sender is not the owner!");
        
        //Implements custom error to revert the contract without wasting gas on storing the string associated with require
        if(msg.sender != i_owner){
            revert FundMe__NotOwner();
        }

        _;
        /*
            _; tells the function to run the rest of its code. 
            Can be placed before or after the code in the modifier
        */
        
    }
    //Functions
    /* 
        constructor
        receive function (if exists)
        fallback function (if exists)
        external
        public
        internal
        private
        view/pure
    */

    //Immutable keyword saves gas by automatically allocating 32bytes of storage to the variable and allows it to be declared
    //at assignment or later in a constructor function 

    //
    //Constructor is a function that immeditaly gets ran when the contract is called 
    constructor(address s_priceFeedAddress){
        //Sets the owner variable to the address that called this contract
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    //Constant keyword saves gas by instead of saving the variable to memory, it just stores the value assigned to the variable, 
    //every where the variable is located   
    
    /** 
    * @notice This function funds the contract
    * @dev This implements the price feeds library
    */
    //Keyword payable allows the cotnract to recieve funds
    //This is because a contract has an address and you can send money to any address (i.e. a wallet)
    function fund() public payable{
        //Want to fund this contract
        //How to send money to this contract? 

        //require is basically a try, catch statement that runs the nested code and rejects if it does not resolve
        //require also reverts the contract, returning the users unused gas money 
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "You need to spend more ETH"); 
        //msg.sender is the address of whoever calls the function/contract 
        s_funders.push(msg.sender);
        //Uses the mapping variable s_addressToAmountFunded to store the caller's address and deposit as a key:value pair 
        s_addressToAmountFunded[msg.sender] += msg.value;

    }

    /** 
    * @notice This function allows the owner to withdraw funds from the contract 
    * @dev This implements the price feeds library
    */
    //onlyOwner modifire used to check if the address who called this contract matches the owner's address
    function withdraw() public onlyOwner{

        for(uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++){
            address funder = s_funders[funderIndex];
            //Resets the person who called this function/contract account back to 0
            s_addressToAmountFunded[funder] = 0;
        }

        //Reset funders array back to empty
        s_funders = new address[](0);

        //Withdraw funds
        //Transfer method: *payable(msg.sender) == payable address
        //payable(msg.sender).transfer(address(this).balance);

        //Send method: Require statement necessary because the send method does not automatically revert the transaction, just 
        //returns a boolean
        //bool sendSuccess = payable(msg.sender).send(address(this).balance);
        //require(sendSuccess, "Send failed");

        /*
            **Recommended method to send or recieve ETH/native tokens
            Call method: returns two values: bool callSuccess and bytes dataReturned.
            The call function takes in a function but can be left blank using ""
            The curly brackets allow you to interact with the call function
        */
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess);
    }

    function cheaperWithdraw() public onlyOwner{
        //Stores the funders array into the functions "memory", it gets deleted after the contract is closed
        address[] memory funders = s_funders; 

        for(uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++){
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0; 
        }

        s_funders = new address[](0);
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess);

    }

    function getOwner() public view returns(address){
        return i_owner;
    }

    function getFunder(uint256 index) public view returns(address){
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder) public view returns(uint256){
        return s_addressToAmountFunded[funder];
    }    

    function getPriceFeed() public view returns(AggregatorV3Interface){
        return s_priceFeed;
    }
   
}