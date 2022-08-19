export interface MarketPricesHuobiDataModel {
	symbol: string;
	open: number;
	high: number;
	low: number;
	close: number;
	amount: number;
	vol: number;
	count: number;
	bid: number;
	bidSize: number;
	ask: number;
	askSize: number;
}
export interface MarketPricesHuobiModel {
	status: string;
	ts: number;
	data: MarketPricesHuobiDataModel[];
}
