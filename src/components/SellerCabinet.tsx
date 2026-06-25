import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const AUTH_URL = 'https://functions.poehali.dev/04377dde-f31e-44e1-a66a-ea557a974e9c';
const PRODUCTS_URL = 'https://functions.poehali.dev/5c02f9fc-1b5e-40d5-85a5-54f0b92df362';

const CATEGORIES = [
  { name: 'Электроника', sub: ['Смартфоны', 'Наушники', 'Ноутбуки', 'Аксессуары'] },
  { name: 'Одежда и обувь', sub: ['Кроссовки', 'Куртки', 'Платья', 'Сумки'] },
  { name: 'Дом и сад', sub: ['Кухня', 'Текстиль', 'Декор', 'Инструменты'] },
  { name: 'Красота', sub: ['Уход', 'Парфюм', 'Макияж'] },
  { name: 'Детям', sub: ['Игрушки', 'Одежда', 'Питание'] },
  { name: 'Спорт', sub: ['Тренажёры', 'Одежда', 'Питание'] },
];

type Seller = { id: number; firstName: string; lastName: string; email: string };
type Product = { id: number; title: string; price: number; oldPrice: number | null; image: string | null; category: string; sub: string | null };

type Props = { onClose: () => void };

export default function SellerCabinet({ onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'register' | 'cabinet'>('login');
  const [seller, setSeller] = useState<Seller | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Login/register form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  // Add product form
  const [addOpen, setAddOpen] = useState(false);
  const [productForm, setProductForm] = useState({ title: '', price: '', oldPrice: '', category: '', subCategory: '', description: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('seller_token');
    if (saved) {
      fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'me', token: saved }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.seller) {
            setToken(saved);
            setSeller(d.seller);
            setMode('cabinet');
          } else {
            localStorage.removeItem('seller_token');
          }
        })
        .catch(() => {});
    }
  }, []);

  // Load products when in cabinet
  useEffect(() => {
    if (mode === 'cabinet' && token) loadProducts();
  }, [mode, token]);

  const loadProducts = async () => {
    const r = await fetch(PRODUCTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'my_products', token }),
    });
    const d = await r.json();
    if (d.products) setProducts(d.products);
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast({ title: 'Введите email и пароль', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...loginForm }),
      });
      const d = await r.json();
      if (d.success) {
        localStorage.setItem('seller_token', d.token);
        setToken(d.token);
        setSeller(d.seller);
        setMode('cabinet');
      } else {
        toast({ title: d.error || 'Ошибка входа', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.password) {
      toast({ title: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...regForm }),
      });
      const d = await r.json();
      if (d.success) {
        toast({ title: 'Заявка отправлена!', description: 'Ожидайте активации от администратора' });
        setMode('login');
        setRegForm({ firstName: '', lastName: '', email: '', password: '' });
      } else {
        toast({ title: d.error || 'Ошибка регистрации', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageBase64(result.split(',')[1] || '');
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async () => {
    if (!productForm.title || !productForm.price || !productForm.category) {
      toast({ title: 'Укажите название, цену и категорию', variant: 'destructive' });
      return;
    }
    setAddLoading(true);
    try {
      const r = await fetch(PRODUCTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_product',
          token,
          ...productForm,
          imageBase64,
        }),
      });
      const d = await r.json();
      if (d.success) {
        toast({ title: 'Товар добавлен!', description: 'Он уже виден в каталоге' });
        setAddOpen(false);
        setProductForm({ title: '', price: '', oldPrice: '', category: '', subCategory: '', description: '' });
        setImagePreview(null);
        setImageBase64('');
        loadProducts();
      } else {
        toast({ title: d.error || 'Ошибка', variant: 'destructive' });
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('seller_token');
    setToken('');
    setSeller(null);
    setMode('login');
    setProducts([]);
  };

  const subOptions = CATEGORIES.find((c) => c.name === productForm.category)?.sub || [];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Icon name="Store" className="text-white" size={16} />
              </div>
              <span className="font-bold">Кабинет продавца</span>
            </div>
          </div>
          {seller && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {seller.firstName} {seller.lastName}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <Icon name="LogOut" size={16} className="mr-1" /> Выйти
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="container max-w-lg mx-auto py-10 px-4">

        {/* LOGIN */}
        {mode === 'login' && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3">
                <Icon name="Store" className="text-white" size={26} />
              </div>
              <h2 className="text-2xl font-bold">Вход для продавца</h2>
              <p className="text-muted-foreground text-sm mt-1">Управляйте своими товарами</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="seller@mail.com" value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
              <div className="space-y-1">
                <Label>Пароль</Label>
                <Input type="password" placeholder="••••••" value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
              </div>
              <Button className="w-full h-11" onClick={handleLogin} disabled={loading}>
                {loading ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Вход...</> : 'Войти'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Нет аккаунта?{' '}
                <button onClick={() => setMode('register')} className="text-primary font-medium hover:underline">
                  Подать заявку
                </button>
              </p>
            </div>
          </div>
        )}

        {/* REGISTER */}
        {mode === 'register' && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3">
                <Icon name="UserPlus" className="text-white" size={26} />
              </div>
              <h2 className="text-2xl font-bold">Стать продавцом</h2>
              <p className="text-muted-foreground text-sm mt-1">После проверки администратор активирует аккаунт</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Имя</Label>
                  <Input placeholder="Иван" value={regForm.firstName}
                    onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Фамилия</Label>
                  <Input placeholder="Иванов" value={regForm.lastName}
                    onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" placeholder="seller@mail.com" value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Пароль</Label>
                <Input type="password" placeholder="Минимум 6 символов" value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
              </div>
              <Button className="w-full h-11" onClick={handleRegister} disabled={loading}>
                {loading ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Отправка...</> : 'Отправить заявку'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <button onClick={() => setMode('login')} className="text-primary font-medium hover:underline">
                  Войти
                </button>
              </p>
            </div>
          </div>
        )}

        {/* CABINET */}
        {mode === 'cabinet' && seller && (
          <div className="space-y-5 animate-fade-in">
            {/* Welcome card */}
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Добро пожаловать,</p>
                <h2 className="text-xl font-bold">{seller.firstName} {seller.lastName}</h2>
                <p className="text-white/70 text-xs mt-0.5">{seller.email}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon name="Store" className="text-white" size={24} />
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="Package" size={20} className="text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{products.length}</div>
                <div className="text-sm text-muted-foreground">Товаров в каталоге</div>
              </div>
              <Button className="ml-auto" onClick={() => setAddOpen(true)}>
                <Icon name="Plus" size={16} className="mr-1.5" /> Добавить товар
              </Button>
            </div>

            {/* Add product form */}
            {addOpen && (
              <div className="bg-white rounded-2xl border p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Новый товар</h3>
                  <button onClick={() => setAddOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <Icon name="X" size={18} />
                  </button>
                </div>

                {/* Image upload */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="h-36 object-contain mx-auto rounded-lg" />
                  ) : (
                    <div className="py-4 text-muted-foreground">
                      <Icon name="ImagePlus" size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Нажмите, чтобы загрузить фото</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>

                <div className="space-y-1">
                  <Label>Название товара *</Label>
                  <Input placeholder="Наушники Sony WH-1000" value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Цена (сомони) *</Label>
                    <Input type="number" placeholder="1200" value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Старая цена</Label>
                    <Input type="number" placeholder="1500" value={productForm.oldPrice}
                      onChange={(e) => setProductForm({ ...productForm, oldPrice: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Категория *</Label>
                    <Select value={productForm.category} onValueChange={(v) => setProductForm({ ...productForm, category: v, subCategory: '' })}>
                      <SelectTrigger><SelectValue placeholder="Выберите..." /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Подкатегория</Label>
                    <Select value={productForm.subCategory} onValueChange={(v) => setProductForm({ ...productForm, subCategory: v })} disabled={!subOptions.length}>
                      <SelectTrigger><SelectValue placeholder="Выберите..." /></SelectTrigger>
                      <SelectContent>
                        {subOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Описание</Label>
                  <Textarea placeholder="Опишите товар..." rows={3} value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                </div>

                <Button className="w-full h-11" onClick={handleAddProduct} disabled={addLoading}>
                  {addLoading ? <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Сохранение...</> : <><Icon name="Check" size={16} className="mr-2" />Добавить в каталог</>}
                </Button>
              </div>
            )}

            {/* Products list */}
            <div className="space-y-3">
              <h3 className="font-bold">Мои товары</h3>
              {products.length === 0 ? (
                <div className="bg-white rounded-2xl border p-10 text-center text-muted-foreground">
                  <Icon name="PackagePlus" className="mx-auto mb-3 opacity-30" size={40} />
                  <p className="text-sm">Товаров ещё нет. Добавьте первый!</p>
                </div>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border flex items-center gap-3 p-3">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-14 h-14 rounded-lg object-cover bg-muted" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                        <Icon name="Image" size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-primary font-bold text-sm">{p.price.toLocaleString('ru-RU')} с.</span>
                        {p.oldPrice && <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString('ru-RU')} с.</span>}
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">{p.category}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
