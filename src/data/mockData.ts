import { Lottery, Purchase } from "@/types";

export const mockLotteries: Lottery[] = [
  {
    id: "1",
    name: "iPhone 16 Pro Max",
    description: "Concorra ao novo iPhone 16 Pro Max 256GB! O smartphone mais avançado da Apple com câmera de 48MP e chip A18 Pro.",
    image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop",
    price_per_number: 50,
    total_numbers: 1000000,
    sold_numbers: 83333,
    start_date: "2026-03-01",
    end_date: "2026-04-30",
    status: "active",
    prizes: [
      { id: "p1", name: "iPhone 16 Pro Max", description: "256GB - Titânio Natural", image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop", position: 1 },
      { id: "p2", name: "AirPods Pro 2", description: "Com estojo de carregamento MagSafe", image_url: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=300&h=300&fit=crop", position: 2 },
    ],
  },
  {
    id: "2",
    name: "Toyota Corolla 2026",
    description: "Ganhe um Toyota Corolla 0km! Sedan executivo com motor híbrido, câmbio CVT e pacote completo de segurança.",
    image_url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop",
    price_per_number: 100,
    total_numbers: 500000,
    sold_numbers: 245000,
    start_date: "2026-02-15",
    end_date: "2026-05-15",
    status: "active",
    prizes: [
      { id: "p3", name: "Toyota Corolla 2026", description: "Híbrido - 0km - Cor Prata", image_url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&h=300&fit=crop", position: 1 },
    ],
  },
  {
    id: "3",
    name: "MacBook Pro M4",
    description: "MacBook Pro 14 polegadas com chip M4 Pro, 18GB RAM e 512GB SSD. Performance absurda para trabalho e lazer.",
    image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop",
    price_per_number: 75,
    total_numbers: 200000,
    sold_numbers: 156000,
    start_date: "2026-03-10",
    end_date: "2026-04-10",
    status: "active",
    prizes: [
      { id: "p4", name: "MacBook Pro M4", description: "14\" - M4 Pro - 18GB RAM", image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop", position: 1 },
    ],
  },
];

export const mockPurchases: Purchase[] = [
  {
    id: "pur1",
    lottery_id: "1",
    lottery_name: "iPhone 16 Pro Max",
    quantity: 5,
    total_amount: 250,
    phone: "841234567",
    payment_method: "mpesa",
    status: "paid",
    numbers: ["000123", "000124", "000125", "000126", "000127"],
    created_at: "2026-03-15T10:30:00Z",
  },
  {
    id: "pur2",
    lottery_id: "2",
    lottery_name: "Toyota Corolla 2026",
    quantity: 10,
    total_amount: 1000,
    phone: "861234567",
    payment_method: "emola",
    status: "pending",
    numbers: ["000200", "000201", "000202", "000203", "000204", "000205", "000206", "000207", "000208", "000209"],
    created_at: "2026-03-16T14:20:00Z",
  },
];
