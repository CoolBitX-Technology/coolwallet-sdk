import ETH from '../src';


class MockTransport {
  constructor() {
    this.name = 'Mock Transport';
  }

  async sendCommandToCard(command) {
    console.log(`${this.name} sendCommandToCard ${command}`);
  }

  async sendDataToCard(packets) {
    console.log(`${this.name} sendDataToCard ${packets}`);
  }

  async checkCardStatus() {
    console.log(`${this.name} checkCardStatus`);
    return 9000;
  }

  async readDataFromCard(command) {
    console.log(`${this.name} readDataFromCard`);
  }
}

const transport = new MockTransport();
const eth = new ETH(transport, '', '');

test('should be zero ', async () => {
  const l = await eth.getAddress(0);
  console.log(l);
});
