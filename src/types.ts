export interface Prize {
  id: string;
  name: string;
  description: string;
  image_url: string;
  position: number;
}

export interface Lottery {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_per_number: number;
  total_numbers: number;
  sold_numbers: number;
  start_date: string;
  end_date: string;
  status: string;
  prizes: Prize[];
}

export interface Purchase {
  id: string;
  lottery_id: string;
  lottery_name: string;
  quantity: number;
  total_amount: number;
  phone: string;
  payment_method: string;
  status: string;
  numbers: string[];
  created_at: string;
}
