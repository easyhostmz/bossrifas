import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Check, ChevronsUpDown, Calendar as CalendarIcon, Info, XCircle, AlertTriangle, CheckCircle, Bell, Mail, Settings, User, Search, Plus, Trash2, Edit, MoreHorizontal, Moon, Sun, Star, Heart, Home, FileText, BarChart3, Upload, Download, Eye, EyeOff, Copy, ExternalLink, Filter, ArrowUpDown, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/* ─────────── Color helpers ─────────── */
const ColorSwatch = ({ name, variable, className }: { name: string; variable: string; className: string }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className={`w-16 h-16 rounded-lg border border-border shadow-sm ${className}`} />
    <span className="text-xs font-medium text-foreground">{name}</span>
    <span className="text-[10px] text-muted-foreground">{variable}</span>
  </div>
);

const ScaleRow = ({ shades }: { shades: { name: string; bg: string }[] }) => (
  <div className="flex gap-2 flex-wrap">
    {shades.map((s) => (
      <div key={s.name} className="flex flex-col items-center gap-1">
        <div className="w-14 h-14 rounded-lg border border-border" style={{ backgroundColor: s.bg }} />
        <span className="text-xs font-medium">{s.name}</span>
      </div>
    ))}
  </div>
);

/* ─────────── Section wrapper ─────────── */
const Section = ({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-20">
    <h2 className="text-2xl font-bold mb-1">{title}</h2>
    {description && <p className="text-muted-foreground mb-4">{description}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

/* ─────────── Navigation items ─────────── */
const navSections = [
  {
    title: "Foundation",
    items: [
      { name: "Colors", href: "#colors" },
      { name: "Typography", href: "#typography" },
      { name: "Radius & Shadows", href: "#radius-shadows" },
    ],
  },
  {
    title: "Forms",
    items: [
      { name: "Button", href: "#button" },
      { name: "Input", href: "#input" },
      { name: "Textarea", href: "#textarea" },
      { name: "Select", href: "#select" },
      { name: "Checkbox", href: "#checkbox" },
      { name: "Radio Group", href: "#radio-group" },
      { name: "Switch", href: "#switch" },
      { name: "Slider", href: "#slider" },
      { name: "Toggle", href: "#toggle" },
    ],
  },
  {
    title: "Data Display",
    items: [
      { name: "Badge", href: "#badge" },
      { name: "Avatar", href: "#avatar" },
      { name: "Card", href: "#card" },
      { name: "Table", href: "#table" },
      { name: "Accordion", href: "#accordion" },
      { name: "Tabs", href: "#tabs" },
    ],
  },
  {
    title: "Feedback",
    items: [
      { name: "Alert", href: "#alert" },
      { name: "Progress", href: "#progress" },
      { name: "Skeleton", href: "#skeleton" },
    ],
  },
  {
    title: "Overlay",
    items: [
      { name: "Dialog", href: "#dialog" },
      { name: "Alert Dialog", href: "#alert-dialog" },
      { name: "Sheet", href: "#sheet" },
      { name: "Dropdown Menu", href: "#dropdown-menu" },
      { name: "Popover", href: "#popover" },
      { name: "Tooltip", href: "#tooltip" },
      { name: "Hover Card", href: "#hover-card" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { name: "Breadcrumb", href: "#breadcrumb" },
      { name: "Pagination", href: "#pagination" },
    ],
  },
  {
    title: "Layout",
    items: [
      { name: "Separator", href: "#separator" },
      { name: "Scroll Area", href: "#scroll-area" },
      { name: "Aspect Ratio", href: "#aspect-ratio" },
      { name: "Collapsible", href: "#collapsible" },
    ],
  },
];

/* ═══════════ MAIN PAGE ═══════════ */
const Styleguide = () => {
  const [isDark, setIsDark] = useState(false);
  const [progressVal] = useState(68);
  const [sliderVal, setSliderVal] = useState([50]);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── HEADER ── */}
      <div className="bg-primary text-primary-foreground py-10 px-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <h1 className="text-3xl font-bold">Design System</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">Boss dos Prêmios — Tokens & Components</p>
          </div>
          <Button variant="outline" size="icon" onClick={toggleDark} className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* ── SIDEBAR ── */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-[120px] self-start py-6 pr-6">
          <nav className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.title}</p>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded-md block transition-colors">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── CONTENT ── */}
        <main className="flex-1 p-6 space-y-16 min-w-0">

          {/* ═══ FOUNDATION ═══ */}

          <Section id="colors" title="Colors" description="Primary (purple), neutrals, and semantic colors">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Primary Scale</h3>
                <ScaleRow shades={[
                  { name: "50", bg: "hsl(262,60%,97%)" }, { name: "100", bg: "hsl(262,55%,93%)" },
                  { name: "200", bg: "hsl(262,55%,85%)" }, { name: "300", bg: "hsl(262,60%,75%)" },
                  { name: "400", bg: "hsl(262,68%,65%)" }, { name: "500", bg: "hsl(262,72%,55%)" },
                  { name: "600", bg: "hsl(262,72%,48%)" }, { name: "700", bg: "hsl(262,72%,40%)" },
                  { name: "800", bg: "hsl(262,72%,30%)" }, { name: "900", bg: "hsl(262,72%,20%)" },
                ]} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Grey Scale</h3>
                <ScaleRow shades={[
                  { name: "50", bg: "hsl(240,5%,97%)" }, { name: "100", bg: "hsl(240,5%,93%)" },
                  { name: "200", bg: "hsl(240,5%,85%)" }, { name: "300", bg: "hsl(240,5%,75%)" },
                  { name: "400", bg: "hsl(240,5%,60%)" }, { name: "500", bg: "hsl(240,5%,46%)" },
                  { name: "600", bg: "hsl(240,5%,35%)" }, { name: "700", bg: "hsl(240,5%,25%)" },
                  { name: "800", bg: "hsl(240,10%,14%)" }, { name: "900", bg: "hsl(240,24%,10%)" },
                ]} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Semantic Tokens</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-4">
                  <ColorSwatch name="Background" variable="--background" className="bg-background" />
                  <ColorSwatch name="Foreground" variable="--foreground" className="bg-foreground" />
                  <ColorSwatch name="Primary" variable="--primary" className="bg-primary" />
                  <ColorSwatch name="Secondary" variable="--secondary" className="bg-secondary" />
                  <ColorSwatch name="Muted" variable="--muted" className="bg-muted" />
                  <ColorSwatch name="Accent" variable="--accent" className="bg-accent" />
                  <ColorSwatch name="Card" variable="--card" className="bg-card" />
                  <ColorSwatch name="Destructive" variable="--destructive" className="bg-destructive" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Status Colors</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: "Success", cls: "bg-success", icon: CheckCircle },
                    { name: "Warning", cls: "bg-warning", icon: AlertTriangle },
                    { name: "Info", cls: "bg-info", icon: Info },
                    { name: "Destructive", cls: "bg-destructive", icon: XCircle },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className={`w-10 h-10 rounded-lg ${c.cls} flex items-center justify-center`}>
                        <c.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Separator />

          <Section id="typography" title="Typography" description="Font: Poppins">
            <div className="space-y-4">
              {[
                { label: "H1 — 36px Bold", el: <h1 className="text-4xl font-bold">Boss dos Prêmios</h1> },
                { label: "H2 — 30px Semibold", el: <h2 className="text-3xl font-semibold">Sorteios Ativos</h2> },
                { label: "H3 — 24px Semibold", el: <h3 className="text-2xl font-semibold">Detalhes do Sorteio</h3> },
                { label: "H4 — 20px Medium", el: <h4 className="text-xl font-medium">Informações</h4> },
                { label: "Body — 16px Regular", el: <p>Participe dos melhores sorteios e concorra a prêmios incríveis.</p> },
                { label: "Small — 14px", el: <p className="text-sm text-muted-foreground">Texto auxiliar com cor muted.</p> },
                { label: "Gradient", el: <p className="text-2xl font-bold text-gradient">Text Gradient</p> },
              ].map((t, i) => (
                <div key={i}>
                  <span className="text-xs text-muted-foreground">{t.label}</span>
                  {t.el}
                </div>
              ))}
            </div>
          </Section>

          <Separator />

          <Section id="radius-shadows" title="Radius & Shadows">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Border Radius</h3>
                <div className="flex gap-6 items-end flex-wrap">
                  {["sm", "md", "lg", "xl", "2xl", "full"].map((r) => (
                    <div key={r} className="flex flex-col items-center gap-2">
                      <div className={`w-16 h-16 bg-primary/20 border-2 border-primary rounded-${r}`} />
                      <span className="text-xs text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Shadows</h3>
                <div className="flex gap-6 flex-wrap">
                  {["shadow-sm", "shadow-md", "shadow-lg", "shadow-xl"].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-2">
                      <div className={`w-24 h-24 bg-card rounded-lg ${s} border`} />
                      <span className="text-xs text-muted-foreground">{s}</span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 bg-card rounded-lg glow-purple border" />
                    <span className="text-xs text-muted-foreground">glow-purple</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Separator />

          {/* ═══ FORMS ═══ */}

          <Section id="button" title="Button" description="All variants, sizes, and states">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Variants</p>
                <div className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Sizes</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button size="sm">Small</Button>
                  <Button>Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">States</p>
                <div className="flex flex-wrap gap-3">
                  <Button disabled>Disabled</Button>
                  <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading</Button>
                  <Button><Mail className="mr-2 h-4 w-4" /> With Icon</Button>
                </div>
              </div>
            </div>
          </Section>

          <Separator />

          <Section id="input" title="Input" description="Text inputs with labels">
            <div className="max-w-sm space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s-name">Nome</Label>
                <Input id="s-name" placeholder="Digite seu nome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" type="email" placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-search">Com ícone</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="s-search" placeholder="Buscar..." className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-dis">Disabled</Label>
                <Input id="s-dis" disabled placeholder="Campo desativado" />
              </div>
            </div>
          </Section>

          <Separator />

          <Section id="textarea" title="Textarea">
            <div className="max-w-sm space-y-2">
              <Label htmlFor="s-ta">Mensagem</Label>
              <Textarea id="s-ta" placeholder="Digite sua mensagem..." />
            </div>
          </Section>

          <Separator />

          <Section id="select" title="Select">
            <div className="max-w-sm space-y-2">
              <Label>Método de pagamento</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="emola">eMola</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Separator />

          <Section id="checkbox" title="Checkbox">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="s-c1" />
                <Label htmlFor="s-c1">Aceito os termos e condições</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="s-c2" defaultChecked />
                <Label htmlFor="s-c2">Receber notificações</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="s-c3" disabled />
                <Label htmlFor="s-c3" className="text-muted-foreground">Disabled</Label>
              </div>
            </div>
          </Section>

          <Separator />

          <Section id="radio-group" title="Radio Group">
            <RadioGroup defaultValue="mpesa">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="mpesa" id="r-mp" />
                <Label htmlFor="r-mp">M-Pesa</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="emola" id="r-em" />
                <Label htmlFor="r-em">eMola</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="card" id="r-cd" />
                <Label htmlFor="r-cd">Cartão</Label>
              </div>
            </RadioGroup>
          </Section>

          <Separator />

          <Section id="switch" title="Switch">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch id="s-sw1" />
                <Label htmlFor="s-sw1">Notificações por email</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="s-sw2" defaultChecked />
                <Label htmlFor="s-sw2">Modo escuro</Label>
              </div>
            </div>
          </Section>

          <Separator />

          <Section id="slider" title="Slider">
            <div className="max-w-sm space-y-2">
              <Label>Quantidade: {sliderVal[0]}</Label>
              <Slider value={sliderVal} onValueChange={setSliderVal} max={100} step={1} />
            </div>
          </Section>

          <Separator />

          <Section id="toggle" title="Toggle & Toggle Group">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Toggle aria-label="Bold"><span className="font-bold">B</span></Toggle>
                <Toggle aria-label="Italic"><span className="italic">I</span></Toggle>
                <Toggle aria-label="Underline"><span className="underline">U</span></Toggle>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Toggle Group</p>
                <ToggleGroup type="single" defaultValue="list">
                  <ToggleGroupItem value="grid"><BarChart3 className="h-4 w-4" /></ToggleGroupItem>
                  <ToggleGroupItem value="list"><FileText className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </Section>

          <Separator />

          {/* ═══ DATA DISPLAY ═══ */}

          <Section id="badge" title="Badge" description="All variants">
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </Section>

          <Separator />

          <Section id="avatar" title="Avatar">
            <div className="flex gap-4 items-center">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>BP</AvatarFallback>
              </Avatar>
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-lg">LG</AvatarFallback>
              </Avatar>
            </div>
          </Section>

          <Separator />

          <Section id="card" title="Card" description="Card variations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sorteio Premium</CardTitle>
                  <CardDescription>Concorra a prêmios incríveis</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">15 MT</p>
                  <p className="text-sm text-muted-foreground">por número</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Participar</Button>
                </CardFooter>
              </Card>
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-primary">Destaque</CardTitle>
                  <CardDescription>Card com borda primária</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge>Ativo</Badge>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Glass Card</CardTitle>
                  <CardDescription>Backdrop blur effect</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">Novo</Badge>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Separator />

          <Section id="table" title="Table">
            <Card>
              <Table>
                <TableCaption>Últimas transações</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { user: "João Silva", method: "M-Pesa", status: "Pago", amount: "150 MT" },
                    { user: "Maria Santos", method: "eMola", status: "Pendente", amount: "75 MT" },
                    { user: "Carlos Luz", method: "Cartão", status: "Falhou", amount: "300 MT" },
                  ].map((row) => (
                    <TableRow key={row.user}>
                      <TableCell className="font-medium">{row.user}</TableCell>
                      <TableCell>{row.method}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "Pago" ? "default" : row.status === "Pendente" ? "secondary" : "destructive"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{row.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Section>

          <Separator />

          <Section id="accordion" title="Accordion">
            <Accordion type="single" collapsible className="max-w-lg">
              <AccordionItem value="item-1">
                <AccordionTrigger>Como participar de um sorteio?</AccordionTrigger>
                <AccordionContent>Escolha um sorteio ativo, selecione a quantidade de números e efetue o pagamento via M-Pesa ou eMola.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Quando é realizado o sorteio?</AccordionTrigger>
                <AccordionContent>O sorteio é realizado automaticamente na data de encerramento definida pelo administrador.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Como recebo meu prêmio?</AccordionTrigger>
                <AccordionContent>O vencedor é contactado por telefone e o prêmio é entregue conforme as regras do sorteio.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>

          <Separator />

          <Section id="tabs" title="Tabs">
            <Tabs defaultValue="overview" className="max-w-lg">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="analytics">Análises</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="p-4 border rounded-lg mt-2">
                <p className="text-sm text-muted-foreground">Conteúdo da visão geral com estatísticas do sorteio.</p>
              </TabsContent>
              <TabsContent value="analytics" className="p-4 border rounded-lg mt-2">
                <p className="text-sm text-muted-foreground">Gráficos e métricas de desempenho.</p>
              </TabsContent>
              <TabsContent value="settings" className="p-4 border rounded-lg mt-2">
                <p className="text-sm text-muted-foreground">Configurações da plataforma.</p>
              </TabsContent>
            </Tabs>
          </Section>

          <Separator />

          {/* ═══ FEEDBACK ═══ */}

          <Section id="alert" title="Alert" description="Informational and destructive variants">
            <div className="space-y-3 max-w-lg">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Informação</AlertTitle>
                <AlertDescription>Este é um alerta informativo padrão.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>Algo deu errado. Tente novamente.</AlertDescription>
              </Alert>
            </div>
          </Section>

          <Separator />

          <Section id="progress" title="Progress">
            <div className="max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span>Números vendidos</span>
                <span className="text-muted-foreground">{progressVal}%</span>
              </div>
              <Progress value={progressVal} />
            </div>
          </Section>

          <Separator />

          <Section id="skeleton" title="Skeleton">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          </Section>

          <Separator />

          {/* ═══ OVERLAY ═══ */}

          <Section id="dialog" title="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Abrir Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Sorteio</DialogTitle>
                  <DialogDescription>Preencha os dados para criar um novo sorteio.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Nome do sorteio" />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço</Label>
                    <Input placeholder="15" type="number" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Section>

          <Separator />

          <Section id="alert-dialog" title="Alert Dialog">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Excluir</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação não pode ser desfeita. O sorteio será permanentemente removido.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Section>

          <Separator />

          <Section id="sheet" title="Sheet">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Abrir Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>Ajuste os filtros de busca.</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="closed">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </Section>

          <Separator />

          <Section id="dropdown-menu" title="Dropdown Menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><MoreHorizontal className="mr-2 h-4 w-4" /> Ações</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                <DropdownMenuItem><Copy className="mr-2 h-4 w-4" /> Duplicar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Section>

          <Separator />

          <Section id="popover" title="Popover">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Info</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Detalhes do Sorteio</h4>
                  <p className="text-sm text-muted-foreground">Informações adicionais sobre o sorteio selecionado.</p>
                </div>
              </PopoverContent>
            </Popover>
          </Section>

          <Separator />

          <Section id="tooltip" title="Tooltip">
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon"><Info className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Mais informações</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Configurações</TooltipContent>
              </Tooltip>
            </div>
          </Section>

          <Separator />

          <Section id="hover-card" title="Hover Card">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link">@bossdospremios</Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarFallback>BP</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-semibold">Boss dos Prêmios</h4>
                    <p className="text-sm text-muted-foreground">Plataforma de sorteios online com pagamento via M-Pesa e eMola.</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </Section>

          <Separator />

          {/* ═══ NAVIGATION ═══ */}

          <Section id="breadcrumb" title="Breadcrumb">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Início</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Sorteios</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Mega Prêmio</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </Section>

          <Separator />

          <Section id="pagination" title="Pagination">
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                <PaginationItem><PaginationEllipsis /></PaginationItem>
                <PaginationItem><PaginationNext href="#" /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </Section>

          <Separator />

          {/* ═══ LAYOUT ═══ */}

          <Section id="separator" title="Separator">
            <div className="space-y-4 max-w-sm">
              <div>
                <h4 className="text-sm font-medium">Horizontal</h4>
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground">Conteúdo abaixo do separador.</p>
              </div>
              <div className="flex h-8 items-center gap-4">
                <span className="text-sm">Item A</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Item B</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Item C</span>
              </div>
            </div>
          </Section>

          <Separator />

          <Section id="scroll-area" title="Scroll Area">
            <ScrollArea className="h-48 w-full max-w-sm rounded-md border p-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="py-2 border-b last:border-0">
                  <p className="text-sm">Número sorteado #{String(i + 1).padStart(6, "0")}</p>
                </div>
              ))}
            </ScrollArea>
          </Section>

          <Separator />

          <Section id="aspect-ratio" title="Aspect Ratio">
            <div className="w-[300px]">
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">16:9</p>
              </AspectRatio>
            </div>
          </Section>

          <Separator />

          <Section id="collapsible" title="Collapsible">
            <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen} className="max-w-sm space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Detalhes avançados</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <div className="rounded-md border px-4 py-3 text-sm">Item visível</div>
              <CollapsibleContent className="space-y-2">
                <div className="rounded-md border px-4 py-3 text-sm">Item oculto 1</div>
                <div className="rounded-md border px-4 py-3 text-sm">Item oculto 2</div>
              </CollapsibleContent>
            </Collapsible>
          </Section>

          {/* ── FOOTER ── */}
          <div className="text-center py-12 text-sm text-muted-foreground">
            Boss dos Prêmios Design System • Poppins • Purple Theme
          </div>
        </main>
      </div>
    </div>
  );
};

export default Styleguide;
