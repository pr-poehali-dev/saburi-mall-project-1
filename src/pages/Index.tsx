import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import SellerCabinet from '@/components/SellerCabinet';
import AdminPanel from '@/components/AdminPanel';

const WHATSAPP = '929221515';
const BANK_CARD = '929221515';

const HEADPHONES = 'https://cdn.poehali.dev/projects/387659a9-6761-42f9-9afb-8f3ed2e3b99d/files/67b7b95f-bbee-4cac-9a17-9b86d48304a2.jpg';
const SNEAKERS = 'https://cdn.poehali.dev/projects/387659a9-6761-42f9-9afb-8f3ed2e3b99d/files/f7753484-def6-4cff-b387-29339d10a955.jpg';
const PHONE = 'https://cdn.poehali.dev/projects/387659a9-6761-42f9-9afb-8f3ed2e3b99d/files/fc6fb175-eb5d-4fb7-9861-2dc7db2f5f43.jpg';

type Category = {
  name: string;
  icon: string;
  sub: string[];
};

const CATEGORIES: Category[] = [
  { name: 'Электроника', icon: 'Smartphone', sub: ['Смартфоны', 'Наушники', 'Ноутбуки', 'Аксессуары'] },
  { name: 'Одежда и обувь', icon: 'Shirt', sub: ['Кроссовки', 'Куртки', 'Платья', 'Сумки'] },
  { name: 'Дом и сад', icon: 'House', sub: ['Кухня', 'Текстиль', 'Декор', 'Инструменты'] },
  { name: 'Красота', icon: 'Sparkles', sub: ['Уход', 'Парфюм', 'Макияж'] },
  { name: 'Детям', icon: 'Baby', sub: ['Игрушки', 'Одежда', 'Питание'] },
  { name: 'Спорт', icon: 'Dumbbell', sub: ['Тренажёры', 'Одежда', 'Питание'] },
];

type Product = {
  id: number;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  sub: string;
  seller: string;
  rating: number;
};

const PRODUCTS: Product[] = [
  { id: 1, title: 'Беспроводные наушники Pro', price: 1290, oldPrice: 1890, image: HEADPHONES, category: 'Электроника', sub: 'Наушники', seller: 'TechStore', rating: 4.8 },
  { id: 2, title: 'Кроссовки Urban White', price: 890, oldPrice: 1200, image: SNEAKERS, category: 'Одежда и обувь', sub: 'Кроссовки', seller: 'SportLine', rating: 4.6 },
  { id: 3, title: 'Смартфон Galaxy Vision', price: 4990, oldPrice: 5990, image: PHONE, category: 'Электроника', sub: 'Смартфоны', seller: 'TechStore', rating: 4.9 },
  { id: 4, title: 'Наушники для спорта', price: 690, image: HEADPHONES, category: 'Электроника', sub: 'Наушники', seller: 'SoundPro', rating: 4.4 },
  { id: 5, title: 'Кроссовки беговые Light', price: 1190, oldPrice: 1490, image: SNEAKERS, category: 'Спорт', sub: 'Одежда', seller: 'SportLine', rating: 4.7 },
  { id: 6, title: 'Смартфон Lite 128GB', price: 2990, image: PHONE, category: 'Электроника', sub: 'Смартфоны', seller: 'MobileHub', rating: 4.5 },
  { id: 7, title: 'Наушники Premium Gold', price: 2490, oldPrice: 3100, image: HEADPHONES, category: 'Электроника', sub: 'Наушники', seller: 'SoundPro', rating: 5.0 },
  { id: 8, title: 'Кроссовки Classic', price: 990, image: SNEAKERS, category: 'Одежда и обувь', sub: 'Кроссовки', seller: 'StreetWear', rating: 4.3 },
];

type CartItem = Product & { qty: number };

const fmt = (n: number) => n.toLocaleString('ru-RU') + ' c.';

const Index = () => {
  const [showCabinet, setShowCabinet] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 5) {
      setLogoClicks(0);
      setShowAdmin(true);
    }
    setTimeout(() => setLogoClicks(0), 3000);
  };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: '', address: '' });


  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (activeCat && p.category !== activeCat) return false;
      if (activeSub && p.sub !== activeSub) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activeCat, activeSub]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...p, qty: 1 }];
    });
    toast({ title: 'Добавлено в корзину', description: p.title });
  };

  const changeQty = (id: number, d: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + d } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const submitOrder = () => {
    if (!form.name || !form.address) {
      toast({ title: 'Заполните данные', description: 'Укажите имя и адрес доставки', variant: 'destructive' });
      return;
    }
    const lines = cart.map((i) => `• ${i.title} × ${i.qty} = ${fmt(i.price * i.qty)}`).join('%0A');
    const msg = `Новый заказ - Сабури мол%0A%0AПокупатель: ${form.name}%0AАдрес: ${form.address}%0A%0AТовары:%0A${lines}%0A%0AСумма: ${fmt(cartTotal)}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank');
    setCheckoutOpen(false);
    setCart([]);
    setForm({ name: '', address: '' });
    toast({ title: 'Заказ оформлен!', description: 'Сообщение отправлено в WhatsApp' });
  };

  const selectCat = (cat: string, sub: string | null = null) => {
    setActiveCat(cat);
    setActiveSub(sub);
    window.scrollTo({ top: 480, behavior: 'smooth' });
  };

  const resetFilter = () => {
    setActiveCat(null);
    setActiveSub(null);
    setSearch('');
  };

  if (showAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  if (showCabinet) {
    return <SellerCabinet onClose={() => setShowCabinet(false)} />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container py-3 flex items-center gap-4">
          <button onClick={resetFilter} className="flex items-center gap-2 shrink-0">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center select-none"
              onClick={(e) => { e.stopPropagation(); handleLogoClick(); }}
            >
              <Icon name="ShoppingBag" className="text-white" size={22} />
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="font-extrabold text-lg text-foreground">Сабури мол</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">маркетплейс</div>
            </div>
          </button>

          <div className="flex-1 relative">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Искать товары..."
              className="pl-10 h-11 rounded-full bg-muted/50 border-transparent focus-visible:bg-white"
            />
          </div>

          {/* Seller */}
          <Button variant="ghost" className="hidden md:flex gap-2 text-foreground" onClick={() => setShowCabinet(true)}>
            <Icon name="Store" size={18} /> Продавцам
          </Button>

          {/* Cart */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="relative gap-2 text-foreground">
                <Icon name="ShoppingCart" size={20} />
                <span className="hidden sm:inline">Корзина</span>
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Корзина</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-3">
                {cart.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Icon name="ShoppingCart" className="mx-auto mb-3 opacity-30" size={48} />
                    Корзина пуста
                  </div>
                )}
                {cart.map((i) => (
                  <div key={i.id} className="flex gap-3 items-center bg-muted/40 rounded-xl p-2">
                    <img src={i.image} alt={i.title} className="w-16 h-16 object-cover rounded-lg bg-white" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{i.title}</div>
                      <div className="text-primary font-bold">{fmt(i.price)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(i.id, -1)}>
                        <Icon name="Minus" size={14} />
                      </Button>
                      <span className="w-6 text-center text-sm">{i.qty}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(i.id, 1)}>
                        <Icon name="Plus" size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <SheetFooter className="flex-col sm:flex-col gap-3 border-t pt-4">
                  <div className="flex justify-between w-full text-lg font-bold">
                    <span>Итого:</span>
                    <span className="text-primary">{fmt(cartTotal)}</span>
                  </div>
                  <Button className="w-full h-12 text-base" onClick={() => setCheckoutOpen(true)}>
                    Оформить заказ
                  </Button>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* Category bar */}
        <div className="border-t bg-white">
          <div className="container flex gap-1 overflow-x-auto py-2 scrollbar-none">
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => selectCat(c.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  activeCat === c.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                }`}
              >
                <Icon name={c.icon} size={16} /> {c.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mt-5">
        <div className="rounded-3xl bg-gradient-to-r from-primary via-primary to-accent p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative max-w-lg">
            <Badge className="bg-white/20 text-white hover:bg-white/20 mb-3">Скидки до 40%</Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3">
              Тысячи товаров в одном месте
            </h1>
            <p className="text-white/80 mb-5">Покупай без регистрации. Быстрая доставка по всему Таджикистану.</p>
            <Button size="lg" variant="secondary" className="rounded-full font-semibold" onClick={() => window.scrollTo({ top: 480, behavior: 'smooth' })}>
              Перейти к покупкам <Icon name="ArrowRight" size={18} className="ml-1" />
            </Button>
          </div>
        </div>
      </section>

      <div className="container grid lg:grid-cols-[260px_1fr] gap-6 mt-6 pb-16">
        {/* Sidebar catalog */}
        <aside className="hidden lg:block">
          <div className="bg-white rounded-2xl border p-4 sticky top-32">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold flex items-center gap-2">
                <Icon name="LayoutGrid" size={18} className="text-primary" /> Каталог
              </h3>
              {(activeCat || activeSub) && (
                <button onClick={resetFilter} className="text-xs text-primary hover:underline">
                  Сбросить
                </button>
              )}
            </div>
            <Accordion type="single" collapsible className="w-full">
              {CATEGORIES.map((c) => (
                <AccordionItem key={c.name} value={c.name} className="border-b-0">
                  <AccordionTrigger className="py-2 hover:no-underline text-sm">
                    <span className="flex items-center gap-2">
                      <Icon name={c.icon} size={16} className="text-muted-foreground" /> {c.name}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="flex flex-col gap-0.5 pl-7">
                      <button
                        onClick={() => selectCat(c.name)}
                        className="text-left text-sm py-1 text-muted-foreground hover:text-primary"
                      >
                        Все товары
                      </button>
                      {c.sub.map((s) => (
                        <button
                          key={s}
                          onClick={() => selectCat(c.name, s)}
                          className={`text-left text-sm py-1 hover:text-primary ${
                            activeSub === s ? 'text-primary font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </aside>

        {/* Products */}
        <main>
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <button onClick={resetFilter} className="hover:text-primary">Главная</button>
            {activeCat && (<><Icon name="ChevronRight" size={14} /><span className="text-foreground">{activeCat}</span></>)}
            {activeSub && (<><Icon name="ChevronRight" size={14} /><span className="text-foreground">{activeSub}</span></>)}
          </div>

          <h2 className="text-2xl font-bold mb-4">
            {activeSub || activeCat || 'Все товары'}
            <span className="text-muted-foreground font-normal text-base ml-2">{filtered.length} шт.</span>
          </h2>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border p-16 text-center text-muted-foreground">
              <Icon name="PackageSearch" className="mx-auto mb-3 opacity-30" size={48} />
              Товары не найдены
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border overflow-hidden group hover:shadow-lg transition-shadow animate-fade-in flex flex-col"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="relative aspect-square bg-muted/30 overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {p.oldPrice && (
                      <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                        -{Math.round((1 - p.price / p.oldPrice) * 100)}%
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-extrabold text-lg">{fmt(p.price)}</span>
                      {p.oldPrice && <span className="text-xs text-muted-foreground line-through">{fmt(p.oldPrice)}</span>}
                    </div>
                    <div className="text-sm mt-1 line-clamp-2 flex-1">{p.title}</div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5 text-foreground">
                        <Icon name="Star" size={12} className="text-yellow-500 fill-yellow-500" /> {p.rating}
                      </span>
                      <span className="truncate">{p.seller}</span>
                    </div>
                    <Button className="w-full mt-2.5 rounded-xl" size="sm" onClick={() => addToCart(p)}>
                      <Icon name="Plus" size={16} className="mr-1" /> В корзину
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container py-8 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-4">
          <div>© 2026 Сабури мол — маркетплейс</div>
          <div className="flex items-center gap-2">
            <Icon name="MessageCircle" size={16} className="text-green-600" /> WhatsApp: {WHATSAPP}
          </div>
        </div>
      </footer>

      {/* Floating seller button */}
      <button
        onClick={() => setShowCabinet(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-semibold pl-4 pr-5 py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
      >
        <Icon name="Store" size={20} />
        <span className="hidden sm:inline">Кабинет продавца</span>
      </button>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Оформление заказа</DialogTitle>
          </DialogHeader>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2 text-sm">
            <div className="font-semibold flex items-center gap-2 text-primary">
              <Icon name="CreditCard" size={18} /> Инструкция по оплате
            </div>
            <p>Оплата на <b>Dushanbe City Bank</b>:</p>
            <div className="font-mono text-base bg-white rounded-lg px-3 py-2 border">{BANK_CARD}</div>
            <p className="flex items-center gap-1.5">
              <Icon name="MessageCircle" size={15} className="text-green-600" />
              Пришлите чек в WhatsApp: <b>{WHATSAPP}</b>
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label>Ваше имя</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Иван Иванов" />
            </div>
            <div className="space-y-1">
              <Label>Адрес доставки</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="г. Душанбе, ул. ..." />
            </div>
            <div className="flex justify-between text-lg font-bold pt-1">
              <span>К оплате:</span>
              <span className="text-primary">{fmt(cartTotal)}</span>
            </div>
            <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-base" onClick={submitOrder}>
              <Icon name="MessageCircle" size={20} className="mr-2" /> Оформить заказ
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Детали заказа отправятся продавцу в WhatsApp
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;