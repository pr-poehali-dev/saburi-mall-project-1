import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const ADMIN_URL = 'https://functions.poehali.dev/a01a36f4-13aa-48fb-bd1d-aeb45b6876be';

type Seller = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

type Product = {
  id: number;
  title: string;
  price: number;
  image: string | null;
  category: string;
  isActive: boolean;
  seller: string;
  createdAt: string;
};

type Props = { onClose: () => void };

export default function AdminPanel({ onClose }: Props) {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState('sellers');

  const api = async (action: string, extra: object = {}) => {
    const r = await fetch(ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action, ...extra }),
    });
    return r.json();
  };

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const d = await api('list_sellers');
      if (d.sellers) {
        setSellers(d.sellers);
        setAuthed(true);
        sessionStorage.setItem('admin_pwd', password);
      } else {
        toast({ title: 'Неверный пароль', variant: 'destructive' });
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pwd');
    if (saved) {
      setPassword(saved);
    }
  }, []);

  const loadSellers = async () => {
    const d = await api('list_sellers');
    if (d.sellers) setSellers(d.sellers);
  };

  const loadProducts = async () => {
    const d = await api('list_products');
    if (d.products) setProducts(d.products);
  };

  useEffect(() => {
    if (authed && tab === 'sellers') loadSellers();
    if (authed && tab === 'products') loadProducts();
  }, [authed, tab]);

  const toggleSeller = async (id: number, active: boolean) => {
    await api('toggle_seller', { sellerId: id, active });
    toast({ title: active ? 'Продавец активирован' : 'Продавец деактивирован' });
    loadSellers();
  };

  const toggleProduct = async (id: number, active: boolean) => {
    await api('toggle_product', { productId: id, active });
    toast({ title: active ? 'Товар показан' : 'Товар скрыт' });
    loadProducts();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pwd');
    setAuthed(false);
    setPassword('');
    setSellers([]);
    setProducts([]);
  };

  const pendingSellers = sellers.filter((s) => !s.isActive);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Icon name="Shield" className="text-white" size={16} />
              </div>
              <span className="font-bold tracking-tight">Панель администратора</span>
              <Badge className="bg-accent text-white text-xs">ADMIN</Badge>
            </div>
          </div>
          {authed && (
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white" onClick={handleLogout}>
              <Icon name="LogOut" size={15} className="mr-1" /> Выйти
            </Button>
          )}
        </div>
      </header>

      <div className="container max-w-3xl mx-auto py-10 px-4">

        {/* LOGIN */}
        {!authed && (
          <div className="max-w-sm mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <Icon name="ShieldCheck" className="text-white" size={30} />
              </div>
              <h2 className="text-2xl font-bold">Вход для администратора</h2>
              <p className="text-white/40 text-sm mt-1">Доступ только для владельца сайта</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <Input
                type="password"
                placeholder="Секретный пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-primary"
              />
              <Button className="w-full h-11" onClick={handleLogin} disabled={loading}>
                {loading
                  ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Проверка...</>
                  : <><Icon name="LogIn" size={16} className="mr-2" />Войти</>}
              </Button>
            </div>
          </div>
        )}

        {/* PANEL */}
        {authed && (
          <div className="animate-fade-in space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Продавцов', value: sellers.length, icon: 'Users', color: 'text-blue-400' },
                { label: 'Ожидают', value: pendingSellers.length, icon: 'Clock', color: 'text-yellow-400' },
                { label: 'Товаров', value: products.length || '—', icon: 'Package', color: 'text-green-400' },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <Icon name={s.icon} size={20} className={s.color} />
                  <div className="text-2xl font-bold mt-2">{s.value}</div>
                  <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="bg-white/5 border border-white/10 w-full">
                <TabsTrigger value="sellers" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Icon name="Users" size={15} className="mr-1.5" /> Продавцы
                  {pendingSellers.length > 0 && (
                    <Badge className="ml-1.5 bg-accent text-white text-xs px-1.5">{pendingSellers.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="products" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Icon name="Package" size={15} className="mr-1.5" /> Товары
                </TabsTrigger>
              </TabsList>

              {/* SELLERS TAB */}
              <TabsContent value="sellers" className="space-y-3 mt-4">
                {sellers.length === 0 && (
                  <div className="text-center py-12 text-white/30">
                    <Icon name="Users" size={40} className="mx-auto mb-3 opacity-30" />
                    Заявок пока нет
                  </div>
                )}
                {sellers.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                      s.isActive
                        ? 'bg-white/5 border-white/10'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      s.isActive ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <Icon name={s.isActive ? 'UserCheck' : 'UserX'} size={18}
                        className={s.isActive ? 'text-green-400' : 'text-yellow-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{s.firstName} {s.lastName}</div>
                      <div className="text-white/50 text-xs">{s.email}</div>
                      <div className="text-white/30 text-xs mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {!s.isActive ? (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                          onClick={() => toggleSeller(s.id, true)}
                        >
                          <Icon name="Check" size={14} className="mr-1" /> Активировать
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                          onClick={() => toggleSeller(s.id, false)}
                        >
                          <Icon name="Ban" size={14} className="mr-1" /> Отключить
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* PRODUCTS TAB */}
              <TabsContent value="products" className="space-y-3 mt-4">
                {products.length === 0 && (
                  <div className="text-center py-12 text-white/30">
                    <Icon name="Package" size={40} className="mx-auto mb-3 opacity-30" />
                    Товаров пока нет
                  </div>
                )}
                {products.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      p.isActive ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-12 h-12 rounded-lg object-cover bg-white/10 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Icon name="Image" size={18} className="text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.title}</div>
                      <div className="text-white/50 text-xs">{p.seller} · {p.category}</div>
                      <div className="text-primary font-bold text-sm">{p.price.toLocaleString('ru-RU')} с.</div>
                    </div>
                    <div className="shrink-0">
                      {p.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-8 text-xs"
                          onClick={() => toggleProduct(p.id, false)}
                        >
                          <Icon name="EyeOff" size={13} className="mr-1" /> Скрыть
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                          onClick={() => toggleProduct(p.id, true)}
                        >
                          <Icon name="Eye" size={13} className="mr-1" /> Показать
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
