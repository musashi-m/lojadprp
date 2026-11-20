"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STORE_CONFIG, StoreProduct, StoreCategory, formatProductDescriptionText, getDefaultProductCommands } from "@/data/mockProducts";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Layers,
  ShoppingBag,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Search,
  ExternalLink,
  LogOut,
  Lock,
  Shield,
  AlertCircle,
  Eye,
  RefreshCw,
  Tag,
  Check,
  X,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Info,
  Key,
  Fingerprint,
  UserCheck,
  Activity,
  Server,
  LayoutDashboard,
  BarChart3,
  Code2,
  FileText,
  TrendingUp,
  Users,
  ShoppingCart,
  MessageCircle,
  Coins,
  Star,
  Terminal,
  Settings,
  CreditCard,
  Save,
  Send,
  Bell,
  Settings2,
  ChevronDown,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  Code,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Eye as EyeIcon,
} from "lucide-react";

interface AdminUserSession {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  role: string;
}

interface AdminAuthStatus {
  authenticated: boolean;
  user?: AdminUserSession;
  hasOwner: boolean;
  ownerEmail: string | null;
  hasGoogleConfig: boolean;
}

interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  paidOrdersCount: number;
  totalRevenue: number;
  pendingDeliveries: number;
}

interface OrderItem {
  product_id: string;
  product_slug: string;
  product_name: string;
  category: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  status: "PENDING" | "PAID" | "DELIVERED" | "CANCELLED" | "EXPIRED";
  character_id: string;
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  paid_at?: string;
  items?: OrderItem[];
}

interface Coupon {
  code: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  isActive: number;
  createdAt: string;
}

interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  details: string | null;
  ip: string | null;
  created_at: string;
}

function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Dynamic CentralCart rich description matching category & product
function getDefaultCentralCartDescription(product?: Partial<StoreProduct>) {
  if (!product) {
    return formatProductDescriptionText({ category: "coins", name: "30 COINS" });
  }
  return formatProductDescriptionText(product);
}

function AdminContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");
  const [loginError, setLoginError] = useState(urlError || "");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<(StoreCategory & { productCount?: number })[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "products" | "categories" | "orders" | "coupons" | "security" | "settings" | "expirations"
  >("products");

  // Store Settings (Discord Webhook)
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Filters
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // CentralCart WYSIWYG Mode
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

  // CentralCart Post-Purchase Sub-tabs: "commands" | "discord" | "chat"
  const [postPurchaseTab, setPostPurchaseTab] = useState<"commands" | "discord" | "chat">("commands");

  // Remove After Modal State & Expirations Management
  const [isRemoveAfterModalOpen, setIsRemoveAfterModalOpen] = useState(false);
  const [removeAfterPreset, setRemoveAfterPreset] = useState("30 dias");
  const [removeAfterCustomNum, setRemoveAfterCustomNum] = useState("30");
  const [removeAfterCustomUnit, setRemoveAfterCustomUnit] = useState("dias");
  const [expirations, setExpirations] = useState<any[]>([]);
  const [isLoadingExpirations, setIsLoadingExpirations] = useState(false);

  const loadExpirations = async () => {
    setIsLoadingExpirations(true);
    try {
      const res = await fetch("/api/admin/expirations");
      if (res.ok) {
        const data = await res.json();
        setExpirations(data.expirations || []);
      }
    } catch (e) {
      console.error("Erro ao carregar expirações:", e);
    } finally {
      setIsLoadingExpirations(false);
    }
  };

  const handleTriggerExpiration = async (expId: string) => {
    if (!confirm("Deseja forçar a expiração deste plano agora? O comando removevip será enviado imediatamente ao FiveM e notificado no Discord.")) return;
    try {
      const res = await fetch("/api/admin/expirations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger", id: expId }),
      });
      if (res.ok) {
        showNotification("Expiração disparada com sucesso! O FiveM processará a remoção.");
        loadExpirations();
      } else {
        alert("Erro ao disparar expiração.");
      }
    } catch {
      alert("Falha na requisição.");
    }
  };

  // Command Generator Modal State (CentralCart Signature)
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isRowSettingsModalOpen, setIsRowSettingsModalOpen] = useState(false);
  const [editingCommandIdx, setEditingCommandIdx] = useState<number | null>(null);

  const [cmdModalTiming, setCmdModalTiming] = useState<string>("Após a confirmação");
  const [cmdModalType, setCmdModalType] = useState<string>("item");
  const [cmdSearchFilter, setCmdSearchFilter] = useState<string>("");
  const [isCmdTypeDropdownOpen, setIsCmdTypeDropdownOpen] = useState<boolean>(false);

  // Dynamic input fields
  const [cmdItemName, setCmdItemName] = useState<string>("");
  const [cmdItemAmount, setCmdItemAmount] = useState<string>("1");
  const [cmdCoinsAmount, setCmdCoinsAmount] = useState<string>("30");
  const [cmdGemasAmount, setCmdGemasAmount] = useState<string>("60");
  const [cmdVipType, setCmdVipType] = useState<string>("paulista");
  const [cmdVipDays, setCmdVipDays] = useState<string>("30");
  const [cmdVipAutoRemove, setCmdVipAutoRemove] = useState<boolean>(true);
  const [cmdMoneyAmount, setCmdMoneyAmount] = useState<string>("100000");
  const [cmdCustomText, setCmdCustomText] = useState<string>("");

  const COMMAND_OPTIONS = [
    { id: "item", label: "Adicionar item", category: "Itens / Qbox" },
    { id: "coin", label: "Adicionar coins", category: "Moedas" },
    { id: "gema", label: "Adicionar gemas", category: "Moedas" },
    { id: "vip", label: "Adicionar VIP", category: "Planos VIP" },
    { id: "removevip", label: "Remover VIP", category: "Planos VIP" },
    { id: "som", label: "Sistema de som", category: "Sistemas" },
    { id: "armas", label: "Sistema de armas", category: "Sistemas" },
    { id: "money", label: "Adicionar dinheiro", category: "Economia" },
    { id: "custom", label: "Comando customizado", category: "Avançado" },
    { id: "group_add", label: "Adicionar grupo", category: "Permissões" },
    { id: "group_remove", label: "Remover grupo", category: "Permissões" },
    { id: "vehicle_add", label: "Adicionar veículo", category: "Veículos" },
    { id: "vehicle_remove", label: "Remover veículo", category: "Veículos" },
    { id: "property_add", label: "Adicionar propriedade", category: "Imóveis" },
    { id: "property_remove", label: "Remover propriedade", category: "Imóveis" },
  ];

  const filteredCommandOptions = COMMAND_OPTIONS.filter((c) =>
    c.label.toLowerCase().includes(cmdSearchFilter.toLowerCase()) ||
    c.category.toLowerCase().includes(cmdSearchFilter.toLowerCase())
  );

  const getGeneratedCommandString = () => {
    switch (cmdModalType) {
      case "item":
        return `item2 {client_identifier} ${cmdItemName.trim() || "[item]"} ${cmdItemAmount || "1"}`;
      case "coin":
        return `addcoin {client_identifier} ${cmdCoinsAmount || "30"}`;
      case "gema":
        return `addgema {client_identifier} ${cmdGemasAmount || "60"}`;
      case "vip":
        return `setvip {client_identifier} ${cmdVipType || "turista"} ${cmdVipDays || "30"}`;
      case "removevip":
        return `removevip {client_identifier}`;
      case "som":
        return `addsom {client_identifier}`;
      case "armas":
        return `addarmas {client_identifier}`;
      case "money":
        return `item2 {client_identifier} money ${cmdMoneyAmount || "100000"}`;
      case "group_add":
        return `addgroup {client_identifier} ${cmdItemName.trim() || "vip"}`;
      case "group_remove":
        return `removegroup {client_identifier} ${cmdItemName.trim() || "vip"}`;
      case "vehicle_add":
        return `addcar {client_identifier} ${cmdItemName.trim() || "veiculo"}`;
      case "vehicle_remove":
        return `delcar {client_identifier} ${cmdItemName.trim() || "veiculo"}`;
      case "property_add":
        return `addhouse {client_identifier} ${cmdItemName.trim() || "propriedade"}`;
      case "property_remove":
        return `remhouse {client_identifier} ${cmdItemName.trim() || "propriedade"}`;
      case "custom":
        return cmdCustomText.trim() || `comando {client_identifier}`;
      default:
        return `addcoin {client_identifier} 30`;
    }
  };

  const handleAddGeneratedCommand = () => {
    const primaryCmd = getGeneratedCommandString();
    const newCmds = [
      ...productForm.commands,
      { timing: cmdModalTiming, command: primaryCmd },
    ];

    if (cmdModalType === "vip" && cmdVipAutoRemove && cmdVipDays !== "0") {
      newCmds.push({
        timing: "Quando expirar",
        command: `removevip {client_identifier}`,
      });
    }

    setProductForm((prev) => ({
      ...prev,
      commands: newCmds,
    }));

    setIsCommandModalOpen(false);
    setCmdItemName("");
    setCmdItemAmount("1");
    setCmdCustomText("");
    setIsCmdTypeDropdownOpen(false);
  };

  // CentralCart Product Form State (matching screenshot fields)
  const [productForm, setProductForm] = useState({
    id: "",
    name: "30 COINS",
    slug: "30-coins",
    category: "coins",
    price: "29.90",
    originalPrice: "40.00",
    discount: "25",
    image: "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png",
    description: getDefaultCentralCartDescription(),
    isActive: true,
    cost: "",
    removeAfter: "",
    quantityLimit: false,
    selectedVariable: "",
    commands: [
      { timing: "Após a confirmação", command: "addcoins {client_identifier} 30" },
    ],
    discordActions: [
      { timing: "Após a confirmação", action: "Adicionar cargo", roleId: "" },
    ],
    stock: false,
    minQuantity: false,
    limitPerUser: false,
  });

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    label: "",
    displayOrder: "0",
  });

  // Coupon Form
  const [newCouponForm, setNewCouponForm] = useState({
    code: "",
    discountPercent: "10",
    maxUses: "500",
  });

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      const data: AdminAuthStatus = await res.json();
      setAuthStatus(data);
      if (data.authenticated) {
        loadDashboardData();
      }
    } catch {
      setAuthStatus({
        authenticated: false,
        hasOwner: false,
        ownerEmail: null,
        hasGoogleConfig: false,
      });
    }
  };

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 3500);
  };


  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.discordWebhookUrl) setDiscordWebhookUrl(data.discordWebhookUrl);
      }
    } catch {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Erro ao carregar logs de auditoria:", err);
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, prodRes, catRes, coupRes, auditRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/products?includeInactive=true"),
        fetch("/api/categories"),
        fetch("/api/admin/coupons"),
        fetch("/api/admin/audit"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        if (data.recentOrders) setOrders(data.recentOrders);
      }

      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || []);
      }

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories || []);
      }

      if (coupRes.ok) {
        const data = await coupRes.json();
        setCoupons(data.coupons || []);
      }

      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }
      loadExpirations();
    } catch (err) {
      console.error("Erro ao carregar dados do painel:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/admin/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmailInput, name: googleNameInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || "Erro ao realizar login");
        return;
      }
      setAuthStatus({
        authenticated: true,
        user: data.user,
        hasOwner: true,
        ownerEmail: data.user.email,
        hasGoogleConfig: true,
      });
      loadDashboardData();
    } catch {
      setLoginError("Falha na requisição de login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setAuthStatus((prev) => (prev ? { ...prev, authenticated: false, user: undefined } : null));
      setGoogleEmailInput("");
      setGoogleNameInput("");
      checkAuth();
    } catch (err) {
      console.error(err);
    }
  };

  // Open CentralCart product editor for a new package
  const openNewProductEditor = () => {
    setEditingProductId(null);
    setProductForm({
      id: "",
      name: "",
      slug: "",
      category: categories[0]?.id || "coins",
      price: "",
      originalPrice: "",
      discount: "",
      image: "https://distritopaulista.centralcart.ai/cdn/stores/24490/packages/83ef2cbe-cb6a-4200-82dc-328cca410b09.png",
      description: getDefaultCentralCartDescription({ category: categories[0]?.id || "coins", name: "Novo Produto" }),
      isActive: true,
      cost: "",
      removeAfter: "",
      quantityLimit: false,
      selectedVariable: "",
      commands: [{ timing: "Após a confirmação", command: "addcoin {client_identifier} 30" }],
      discordActions: [],
      stock: false,
      minQuantity: false,
      limitPerUser: false,
    });
    setIsEditingProduct(true);
  };

  // Open CentralCart product editor for existing product
  const openEditProductEditor = (product: StoreProduct) => {
    setEditingProductId(product.id);
    const rawCmds = (product.commands && product.commands.length > 0)
      ? product.commands.map((cmd) => {
          if (typeof cmd === "object" && cmd !== null) {
            return {
              timing: (cmd as any).timing || "Após a confirmação",
              command: (cmd as any).command || "",
            };
          }
          return {
            timing: "Após a confirmação",
            command: String(cmd || ""),
          };
        })
      : getDefaultProductCommands(product);

    setProductForm({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: product.price ? product.price.toString() : "",
      originalPrice: product.originalPrice ? product.originalPrice.toString() : "",
      discount: product.discount ? product.discount.toString() : "",
      image: product.image,
      description: product.description && product.description.trim()
        ? product.description
        : getDefaultCentralCartDescription(product),
      isActive: product.isActive !== false,
      cost: product.cost ? product.cost.toString() : "",
      removeAfter: product.removeAfter || "",
      quantityLimit: Boolean(product.quantityLimit),
      selectedVariable: "",
      commands: rawCmds,
      discordActions: (product as any).discordActions || [],
      stock: Boolean(product.stock),
      minQuantity: Boolean(product.minQuantity),
      limitPerUser: Boolean(product.limitPerUser),
    });
    setIsEditingProduct(true);
  };

  // Save product (PUT or POST)
    const addDiscordAction = () => {
    setProductForm((prev: any) => ({
      ...prev,
      discordActions: [
        ...(prev.discordActions || []),
        { timing: "Após a confirmação", action: "Adicionar cargo", roleId: "" },
      ],
    }));
  };

  const updateDiscordAction = (index: number, field: string, value: string) => {
    setProductForm((prev: any) => {
      const updated = [...(prev.discordActions || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, discordActions: updated };
    });
  };

  const removeDiscordAction = (index: number) => {
    setProductForm((prev: any) => ({
      ...prev,
      discordActions: (prev.discordActions || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category) {
      alert("Nome e categoria são obrigatórios.");
      return;
    }

    const priceNum = parseFloat(productForm.price.replace("R$", "").replace(",", ".").trim());
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Digite um preço numérico válido.");
      return;
    }

    const origPriceNum = productForm.originalPrice
      ? parseFloat(productForm.originalPrice.replace("R$", "").replace(",", ".").trim())
      : undefined;

    const autoSlug =
      productForm.slug.trim() ||
      productForm.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const payload = {
      name: productForm.name.trim(),
      slug: autoSlug,
      category: productForm.category,
      price: priceNum,
      originalPrice: origPriceNum && !isNaN(origPriceNum) ? origPriceNum : undefined,
      discount: productForm.discount ? parseInt(productForm.discount, 10) : undefined,
      image: productForm.image.trim(),
      description: productForm.description,
      isActive: productForm.isActive,
      cost: productForm.cost ? parseFloat(productForm.cost.replace("R$", "").replace(",", ".").trim()) : undefined,
      removeAfter: productForm.removeAfter || undefined,
      quantityLimit: productForm.quantityLimit,
      commands: productForm.commands
        .filter((c) => c.command && c.command.trim().length > 0)
        .map((c) => ({
          timing: c.timing || "Após a confirmação",
          command: c.command.trim(),
        })),
      stock: productForm.stock,
      minQuantity: productForm.minQuantity,
      limitPerUser: productForm.limitPerUser,
      discordActions: ((productForm as any).discordActions || []).filter((a: any) => a.roleId && a.roleId.trim().length > 0),
    };

    try {
      if (editingProductId) {
        const res = await fetch(`/api/products/${editingProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showNotification("Pacote atualizado com sucesso!");
          setIsEditingProduct(false);
          loadDashboardData();
        } else {
          alert("Erro ao atualizar o pacote.");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: `pkg-${Date.now()}` }),
        });
        if (res.ok) {
          showNotification("Pacote criado com sucesso!");
          setIsEditingProduct(false);
          loadDashboardData();
        } else {
          alert("Erro ao criar o pacote.");
        }
      }
    } catch {
      alert("Falha de rede ao salvar o pacote.");
    }
  };

  // Delete product
  const handleDeleteProduct = async (product: { id: string; name: string }) => {
    if (!confirm(`Tem certeza de que deseja deletar o pacote "${product.name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Pacote deletado com sucesso!");
        setIsEditingProduct(false);
        loadDashboardData();
      } else {
        alert("Erro ao excluir o pacote.");
      }
    } catch {
      alert("Falha na requisição.");
    }
  };

  // Commands management
  const addEmptyCommand = () => {
    setProductForm((prev) => ({
      ...prev,
      commands: [...prev.commands, { timing: "Após a confirmação", command: "" }],
    }));
  };

  const addTemplateCommand = () => {
    setProductForm((prev) => ({
      ...prev,
      commands: [
        ...prev.commands,
        { timing: "Após a confirmação", command: `addcoins {client_identifier} 30` },
      ],
    }));
  };

  const updateCommandText = (idx: number, text: string) => {
    setProductForm((prev) => {
      const nextCmds = [...prev.commands];
      nextCmds[idx].command = text;
      return { ...prev, commands: nextCmds };
    });
  };

  const updateCommandTiming = (idx: number, timing: string) => {
    setProductForm((prev) => {
      const nextCmds = [...prev.commands];
      nextCmds[idx].timing = timing;
      return { ...prev, commands: nextCmds };
    });
  };

  const removeCommand = (idx: number) => {
    setProductForm((prev) => ({
      ...prev,
      commands: prev.commands.filter((_, i) => i !== idx),
    }));
  };

  // Categories CRUD

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setWebhookFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordWebhookUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWebhookFeedback({ type: "success", message: "Configuração do Webhook salva com sucesso!" });
      } else {
        setWebhookFeedback({ type: "error", message: data.error || "Erro ao salvar configurações" });
      }
    } catch {
      setWebhookFeedback({ type: "error", message: "Falha na comunicação com o servidor" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookFeedback(null);
    try {
      const res = await fetch("/api/admin/webhook/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: discordWebhookUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWebhookFeedback({ type: "success", message: data.message });
      } else {
        setWebhookFeedback({ type: "error", message: data.error || "Falha ao enviar notificação de teste" });
      }
    } catch {
      setWebhookFeedback({ type: "error", message: "Erro ao testar o webhook" });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.label) return;

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: categoryForm.label,
            displayOrder: parseInt(categoryForm.displayOrder, 10),
          }),
        });
        if (res.ok) {
          showNotification("Categoria atualizada!");
          setIsCategoryModalOpen(false);
          loadDashboardData();
        } else {
          alert("Erro ao atualizar categoria.");
        }
      } else {
        const id =
          categoryForm.id.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") ||
          categoryForm.label.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            label: categoryForm.label,
            displayOrder: parseInt(categoryForm.displayOrder, 10),
          }),
        });
        if (res.ok) {
          showNotification("Categoria criada com sucesso!");
          setIsCategoryModalOpen(false);
          loadDashboardData();
        } else {
          alert("Erro ao criar categoria.");
        }
      }
    } catch {
      alert("Erro na requisição.");
    }
  };

  const handleDeleteCategory = async (id: string, label: string) => {
    if (!confirm(`Deseja excluir a categoria "${label}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Categoria excluída!");
        loadDashboardData();
      } else {
        alert("Erro ao excluir categoria.");
      }
    } catch {
      alert("Erro na requisição.");
    }
  };

  // Coupons
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponForm.code || !newCouponForm.discountPercent) return;

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCouponForm.code.trim().toUpperCase(),
          discountPercent: parseInt(newCouponForm.discountPercent, 10),
          maxUses: newCouponForm.maxUses ? parseInt(newCouponForm.maxUses, 10) : undefined,
        }),
      });
      if (res.ok) {
        showNotification("Cupom criado com sucesso!");
        setNewCouponForm({ code: "", discountPercent: "10", maxUses: "500" });
        loadDashboardData();
      } else {
        alert("Erro ao criar cupom.");
      }
    } catch {
      alert("Erro na requisição.");
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Deseja excluir o cupom "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons?code=${code}`, { method: "DELETE" });
      if (res.ok) {
        showNotification("Cupom excluído!");
        loadDashboardData();
      }
    } catch {
      alert("Erro ao excluir cupom.");
    }
  };

  // Loading state
  if (authStatus === null) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white">
        <RefreshCw className="size-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  // Google Login Screen
  if (!authStatus.authenticated) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <img
                src={STORE_CONFIG.logoUrl}
                alt={STORE_CONFIG.serverName}
                className="size-12 rounded-xl object-contain shadow-lg"
              />
              <span className="font-kanit font-bold text-xl text-white">
                {STORE_CONFIG.serverName}
              </span>
            </Link>
            <h1 className="font-kanit text-2xl font-bold text-white tracking-wide">
              Painel do Proprietário
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Ambiente de gerenciamento privado e isolado da loja oficial.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d111d]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
            {!authStatus.hasOwner ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold font-kanit text-amber-400 text-sm">
                  <Sparkles className="size-4 shrink-0" />
                  <span>PRIMEIRO ACESSO — REGISTRO DO PROPRIETÁRIO</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  A <strong>primeira conta Google</strong> que fizer login agora será cadastrada automaticamente como a dona definitiva deste painel.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold font-kanit text-blue-400 text-sm">
                  <Shield className="size-4 shrink-0" />
                  <span>ACESSO RESTRITO AO PROPRIETÁRIO</span>
                </div>
                <p className="text-zinc-300">
                  Proprietário cadastrado: <strong className="text-white font-mono">{authStatus.ownerEmail}</strong>.
                </p>
              </div>
            )}

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            {authStatus.hasGoogleConfig ? (
              <div>
                <a
                  href="/api/admin/auth/google"
                  className="w-full h-12 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-kanit font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-white/10"
                >
                  <GoogleIcon className="size-5" />
                  <span>ENTRAR COM CONTA GOOGLE</span>
                </a>
                <p className="text-[11px] text-zinc-500 text-center mt-2.5">
                  Autenticação oficial via Google Accounts (OAuth 2.0)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleDevGoogleLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      SEU E-MAIL GOOGLE
                    </label>
                    <input
                      type="email"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      placeholder="ex: seuemail@gmail.com"
                      required
                      autoFocus
                      className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-11 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-kanit font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <RefreshCw className="size-4 animate-spin text-zinc-900" />
                    ) : (
                      <>
                        <GoogleIcon className="size-4" />
                        <span>ENTRAR COM ESTA CONTA GOOGLE</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="text-center mt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Voltar para a Loja</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchCat = categoryFilter === "all" ? true : p.category === categoryFilter;
    const matchSearch =
      productSearch === "" ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#070a13] text-[#e1e7ef] flex font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Toast Notification */}
      {actionMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium border backdrop-blur-md transition-all ${
            actionMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-300 border-rose-500/40"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-400" />
          ) : (
            <AlertCircle className="size-4 text-rose-400" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* CENTRALCART LEFT SIDEBAR NAVIGATION */}
      {/* ============================================================== */}
      <aside className="w-64 shrink-0 bg-[#090d19] border-r border-[#141c2c] flex flex-col justify-between hidden md:flex sticky top-0 h-screen select-none">
        <div className="overflow-y-auto py-5 px-3.5 space-y-6">
          {/* Store Header Identity */}
          <div className="flex items-center gap-3 px-2 py-1">
            <img
              src={STORE_CONFIG.logoUrl}
              alt="Logo"
              className="size-10 rounded-xl object-contain bg-black/40 border border-[#1b2538] shrink-0"
            />
            <div className="overflow-hidden">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                Bem vindo novamente
              </div>
              <div className="font-kanit font-bold text-sm text-white truncate leading-tight">
                DISTRITOPAULISTA RP
              </div>
              <div className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                distritopaulista.centralcart.ai
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-5 text-xs font-medium">
            {/* 1. PRINCIPAL */}
            <div>
              <div className="px-2.5 pb-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Principal
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setActiveTab("dashboard"); setIsEditingProduct(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                    activeTab === "dashboard"
                      ? "bg-[#0e2722] text-[#34d399] font-semibold border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <LayoutDashboard className="size-4 shrink-0" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => { setActiveTab("dashboard"); setIsEditingProduct(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all"
                >
                  <BarChart3 className="size-4 shrink-0" />
                  <span>Estatísticas</span>
                </button>
                <button
                  onClick={() => { setActiveTab("orders"); setIsEditingProduct(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    activeTab === "orders"
                      ? "bg-[#0e2722] text-[#34d399] font-semibold border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="size-4 shrink-0" />
                    <span>Pedidos</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400">
                    {orders.length}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. CATÁLOGO (CENTRALCART SIGNATURE) */}
            <div>
              <div className="px-2.5 pb-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Catálogo
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setActiveTab("categories"); setIsEditingProduct(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    activeTab === "categories"
                      ? "bg-[#0e2722] text-[#34d399] font-semibold border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="size-4 shrink-0" />
                    <span>Categorias</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400">
                    {categories.length}
                  </span>
                </button>

                {/* PRODUTOS (ACTIVE GREEN HIGHLIGHT LIKE SCREENSHOT) */}
                <button
                  onClick={() => { setActiveTab("products"); setIsEditingProduct(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    activeTab === "products"
                      ? "bg-[#0e2722] text-[#34d399] font-semibold border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="size-4 shrink-0" />
                    <span>Produtos</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-emerald-400 font-bold">
                    {products.length}
                  </span>
                </button>

                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <Code2 className="size-4 shrink-0" />
                  <span>Variáveis</span>
                </div>
                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <FileText className="size-4 shrink-0" />
                  <span>Postagens</span>
                </div>
              </div>
            </div>

            {/* 3. MARKETING */}
            <div>
              <div className="px-2.5 pb-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Marketing
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setActiveTab("coupons"); setIsEditingProduct(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    activeTab === "coupons"
                      ? "bg-[#0e2722] text-[#34d399] font-semibold border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className="size-4 shrink-0" />
                    <span>Cupons</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400">
                    {coupons.length}
                  </span>
                </button>

                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <TrendingUp className="size-4 shrink-0" />
                  <span>Upsell</span>
                </div>
                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <Sparkles className="size-4 shrink-0" />
                  <span>Promoções</span>
                </div>
                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <Users className="size-4 shrink-0" />
                  <span>Afiliados</span>
                </div>
                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <ShoppingCart className="size-4 shrink-0" />
                  <span>Carrinho abandonado</span>
                </div>
                <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="size-4 shrink-0" />
                    <span>WhatsApp</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                    BETA
                  </span>
                </div>
              </div>
            </div>

            {/* 4. CLIENTES */}
            <div>
              <div className="px-2.5 pb-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Clientes
              </div>
              <div className="space-y-0.5">
                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <UserCheck className="size-4 shrink-0" />
                  <span>Clientes</span>
                </div>
                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <Coins className="size-4 shrink-0" />
                  <span>Crédito</span>
                </div>
                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <Star className="size-4 shrink-0" />
                  <span>Avaliações</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveTab("expirations" as any); setIsEditingProduct(false); loadExpirations(); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    activeTab === "expirations"
                      ? "bg-[#0e2722] text-[#34d399] font-semibold border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="size-4 shrink-0" />
                    <span>Expirações / VIP</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-emerald-400 font-bold">
                    {expirations.filter((e) => e.status === "ACTIVE").length}
                  </span>
                </button>
              </div>
            </div>

            {/* 5. GERAL & SEGURANÇA */}
            <div>
              <div className="px-2.5 pb-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Geral
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setActiveTab("security"); setIsEditingProduct(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    activeTab === "security"
                      ? "bg-[#0e2722] text-[#34d399] font-semibold border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="size-4 shrink-0 text-emerald-400" />
                    <span>Segurança & Auditoria</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                    ATIVO
                  </span>
                </button>
                <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <Users className="size-4 shrink-0" />
                  <span>Membros</span>
                </div>
                <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="size-4 shrink-0" />
                    <span>Custos</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                    BETA
                  </span>
                </div>
                <button
                  onClick={() => { setActiveTab("settings"); setIsEditingProduct(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    activeTab === "settings"
                      ? "bg-[#0e2722] text-[#34d399] font-semibold border border-[#10b981]/30"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="size-4 shrink-0" />
                    <span>Configurações</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#5865F2]/20 text-[#7983f5]">
                    DISCORD
                  </span>
                </button>
                <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-500 cursor-not-allowed">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="size-4 shrink-0" />
                    <span>Assinatura</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400">
                    30% OFF
                  </span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Bottom Link to Public Store */}
        <div className="p-3.5 border-t border-[#141c2c]">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#10b981] hover:text-[#34d399] transition-colors"
          >
            <span>Ver loja</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTAINER */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#090d19]/90 backdrop-blur-md border-b border-[#141c2c] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <img
                src={STORE_CONFIG.logoUrl}
                alt="Logo"
                className="size-8 rounded-lg object-contain bg-black/40"
              />
            </div>
            <div>
              <div className="font-kanit font-bold text-sm text-white flex items-center gap-2">
                <span>Distrito Paulista RP</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Painel Oficial
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 hidden sm:block">
                distritopaulista.centralcart.ai • Expira em: 5 dias
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Balance Badge like CentralCart */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1424] border border-[#1b253b] text-xs font-mono">
              <span className="text-amber-400">💎</span>
              <span className="text-zinc-200 font-semibold">
                {formatCurrency(stats?.totalRevenue ?? 0)}
              </span>
              <span className="text-zinc-500">/ R$ 20.0K</span>
            </div>

            {/* Notification Bell */}
            <div className="relative p-2 rounded-lg bg-[#0e1424] border border-[#1b253b] text-zinc-400">
              <Bell className="size-4" />
              <span className="absolute -top-1 -right-1 size-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                1
              </span>
            </div>

            {/* User Profile */}
            {authStatus.user && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0e1424] border border-[#1b253b]">
                {authStatus.user.picture ? (
                  <img
                    src={authStatus.user.picture}
                    alt="Avatar"
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-7 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-xs">
                    {authStatus.user.email ? authStatus.user.email.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-white leading-none">
                    {authStatus.user.name || "Proprietário"}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[140px]">
                    {authStatus.user.email}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Sair do Painel"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {/* ============================================================== */}
          {/* TAB: PRODUTOS (CENTRILCART PRODUCT LIST OR EXACT EDITOR) */}
          {/* ============================================================== */}
          {activeTab === "products" && (
            <div>
              {/* IF NOT IN EDIT MODE -> SHOW PRODUCTS TABLE */}
              {!isEditingProduct ? (
                <div className="space-y-5">
                  {/* Top Bar with Title and "+ Criar produto" button */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div>
                      <h2 className="font-kanit font-bold text-xl text-white flex items-center gap-2">
                        <span>Produtos</span>
                        <span className="text-xs font-mono bg-[#0e1424] px-2 py-0.5 rounded-md border border-[#1b253b] text-zinc-400">
                          {products.length} pacotes
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Gerencie todos os itens do catálogo, preços, comandos FiveM e estoque.
                      </p>
                    </div>

                    <button
                      onClick={openNewProductEditor}
                      className="h-10 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-kanit font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
                    >
                      <Plus className="size-4 text-zinc-950" />
                      <span>CRIAR PRODUTO</span>
                    </button>
                  </div>

                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full max-w-sm">
                      <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar por nome ou slug..."
                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#0b0f1d] border border-[#162033] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="h-10 px-3 rounded-lg bg-[#0b0f1d] border border-[#162033] text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">Todas as Categorias</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Products Table */}
                  <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#090d19] border-b border-[#141c2c] text-zinc-400 font-kanit uppercase tracking-wider">
                          <tr>
                            <th className="py-3.5 px-4">Produto</th>
                            <th className="py-3.5 px-4">Categoria</th>
                            <th className="py-3.5 px-4">Preço (R$)</th>
                            <th className="py-3.5 px-4">Preço Comparativo</th>
                            <th className="py-3.5 px-4">Visibilidade</th>
                            <th className="py-3.5 px-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141c2c] text-zinc-300">
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-zinc-500">
                                Nenhum pacote encontrado.
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((p) => (
                              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={p.image}
                                      alt={p.name}
                                      className="size-10 rounded-lg object-contain bg-black/40 border border-[#1b2538] shrink-0"
                                    />
                                    <div>
                                      <div className="font-bold text-white font-kanit text-sm leading-tight">
                                        {p.name}
                                      </div>
                                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                                        {p.slug}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono font-bold uppercase">
                                    {categories.find((c) => c.id === p.category)?.label || p.category}
                                  </span>
                                </td>

                                <td className="py-3 px-4 font-mono font-bold text-white">
                                  {formatCurrency(p.price)}
                                </td>

                                <td className="py-3 px-4 font-mono text-zinc-500">
                                  {p.originalPrice ? (
                                    <span className="line-through">
                                      {formatCurrency(p.originalPrice)}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>

                                <td className="py-3 px-4">
                                  {p.isActive !== false ? (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs">
                                      <span className="size-1.5 rounded-full bg-emerald-400" />
                                      <span>Visível</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-zinc-500 text-xs">
                                      <span className="size-1.5 rounded-full bg-zinc-500" />
                                      <span>Oculto</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Link
                                      href={`/package/${p.slug}`}
                                      target="_blank"
                                      className="p-2 rounded-lg bg-[#0e1424] text-zinc-400 hover:text-white transition-colors"
                                      title="Ver na Loja"
                                    >
                                      <ExternalLink className="size-3.5" />
                                    </Link>
                                    <button
                                      onClick={() => openEditProductEditor(p)}
                                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                      title="Editar Pacote na CentralCart"
                                    >
                                      <Edit className="size-3" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(p)}
                                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                      title="Deletar Pacote"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* ============================================================== */
                /* EXACT CENTRILCART PRODUCT EDIT SCREEN (IDENTICAL TO SCREENSHOT) */
                /* ============================================================== */
                <form onSubmit={handleSaveProduct} className="space-y-6">
                  {/* Top Breadcrumbs / Return Button */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#141c2c]">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <button
                        type="button"
                        onClick={() => setIsEditingProduct(false)}
                        className="hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <ArrowLeft className="size-3.5" />
                        <span>Produtos</span>
                      </button>
                      <span>/</span>
                      <span className="text-white font-semibold">
                        {editingProductId ? `Editar Pacote: ${productForm.name}` : "Novo Pacote"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProduct(false)}
                        className="px-3 py-1.5 rounded-lg bg-[#0e1424] border border-[#1b253b] text-xs font-semibold text-zinc-300 hover:bg-white/5 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-kanit font-bold text-xs shadow-lg transition-colors"
                      >
                        {editingProductId ? "Editar pacote" : "Criar pacote"}
                      </button>
                    </div>
                  </div>

                  {/* 2-Column CentralCart Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* ============================================================ */}
                    {/* LEFT COLUMN: MAIN PROPERTIES (~67% WIDTH) */}
                    {/* ============================================================ */}
                    <div className="lg:col-span-2 space-y-5">
                      {/* 1. Nome & Categoria Card */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                              Nome
                            </label>
                            <input
                              type="text"
                              value={productForm.name}
                              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                              placeholder="30 COINS"
                              required
                              className="w-full h-11 px-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                              Categoria
                            </label>
                            <select
                              value={productForm.category}
                              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                              required
                              className="w-full h-11 px-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-sm text-white focus:outline-none focus:border-emerald-500 font-sans"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 2. WYSIWYG Description Editor */}
                        <div className="rounded-xl border border-[#162033] bg-[#080c18] overflow-hidden">
                          {/* Rich Text Toolbar */}
                          <div className="bg-[#0b0f1d] border-b border-[#162033] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-zinc-400 text-xs">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                              {/* History */}
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Desfazer">
                                <RotateCcw className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Refazer">
                                <RotateCw className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Limpar Formatação">
                                <RemoveFormatting className="size-3.5" />
                              </button>

                              <span className="w-px h-4 bg-[#1c2840] mx-0.5" />

                              {/* Paragraph Format Select */}
                              <select className="h-7 px-2 rounded bg-[#080c18] border border-[#1c2840] text-[11px] text-zinc-300 focus:outline-none">
                                <option>Parágrafo</option>
                                <option>Título 1</option>
                                <option>Título 2</option>
                                <option>Título 3</option>
                              </select>

                              <span className="w-px h-4 bg-[#1c2840] mx-0.5" />

                              {/* Basic Formatting */}
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm((prev) => ({
                                    ...prev,
                                    description: prev.description + "\n**TEXTO EM NEGRITO**",
                                  }));
                                }}
                                className="p-1.5 hover:bg-white/10 rounded font-bold"
                                title="Negrito"
                              >
                                <Bold className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded italic" title="Itálico">
                                <Italic className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded underline" title="Sublinhado">
                                <Underline className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded line-through" title="Tachado">
                                <Strikethrough className="size-3.5" />
                              </button>

                              <span className="w-px h-4 bg-[#1c2840] mx-0.5" />

                              {/* Extra tools */}
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Link">
                                <LinkIcon className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Código">
                                <Code className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Citação">
                                <Quote className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Linha divisória">
                                <Minus className="size-3.5" />
                              </button>

                              <span className="w-px h-4 bg-[#1c2840] mx-0.5" />

                              {/* Alignments */}
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Alinhar à esquerda">
                                <AlignLeft className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Centralizar">
                                <AlignCenter className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Alinhar à direita">
                                <AlignRight className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Justificar">
                                <AlignJustify className="size-3.5" />
                              </button>

                              <span className="w-px h-4 bg-[#1c2840] mx-0.5" />

                              {/* Lists */}
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm((prev) => ({
                                    ...prev,
                                    description: prev.description + "\n• Benefício exclusivo;",
                                  }));
                                }}
                                className="p-1.5 hover:bg-white/10 rounded"
                                title="Lista com Marcadores"
                              >
                                <List className="size-3.5" />
                              </button>
                              <button type="button" className="p-1.5 hover:bg-white/10 rounded" title="Lista Numerada">
                                <ListOrdered className="size-3.5" />
                              </button>
                            </div>

                            {/* Mode Toggle: Visual vs HTML */}
                            <div className="flex items-center gap-1 bg-[#080c18] p-0.5 rounded-lg border border-[#1c2840]">
                              <button
                                type="button"
                                onClick={() => setEditorMode("visual")}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                                  editorMode === "visual"
                                    ? "bg-white/10 text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                <EyeIcon className="size-3" />
                                <span>Visual</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditorMode("html")}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                                  editorMode === "html"
                                    ? "bg-white/10 text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                              >
                                <Code className="size-3" />
                                <span>HTML</span>
                              </button>
                            </div>
                          </div>

                          {/* Editor Textarea */}
                          <textarea
                            value={productForm.description}
                            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                            rows={12}
                            placeholder="Escreva a descrição do produto..."
                            className="w-full p-4 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-y leading-relaxed font-sans font-normal"
                          />
                        </div>
                      </div>

                      {/* 3. Preços Card */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                              Preço comparativo <span className="text-zinc-500 font-normal underline decoration-dashed">(opcional)</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">
                                R$
                              </span>
                              <input
                                type="text"
                                value={productForm.originalPrice}
                                onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                                placeholder="40"
                                className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                              Preço
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">
                                R$
                              </span>
                              <input
                                type="text"
                                value={productForm.price}
                                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                placeholder="29,9"
                                required
                                className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. Custo & Remover do Cliente Após */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                              Custo <span className="text-zinc-500 font-normal underline decoration-dashed">(opcional)</span>
                            </label>
                            <input
                              type="text"
                              value={productForm.cost}
                              onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                              placeholder="R$ 0,00"
                              className="w-full h-11 px-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                              Remover do cliente após:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={productForm.removeAfter}
                                onChange={(e) => setProductForm({ ...productForm, removeAfter: e.target.value })}
                                placeholder="Nunca remover o produto"
                                className="flex-1 h-11 px-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setRemoveAfterPreset(productForm.removeAfter || "30 dias");
                                  setIsRemoveAfterModalOpen(true);
                                }}
                                className="h-11 px-4 rounded-lg bg-[#141b2c] hover:bg-[#1c263c] border border-[#232f4a] text-xs font-semibold text-white transition-colors shrink-0"
                              >
                                Definir
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 5. Limite de quantidade Card */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#080c18] border border-[#1c2840]">
                            <div>
                              <div className="text-xs font-semibold text-zinc-200">
                                Limite de quantidade
                              </div>
                              <div className="text-[11px] text-zinc-500 mt-0.5">
                                Não permite que o cliente aumente a quantidade deste produto no ato da compra.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProductForm((p) => ({ ...p, quantityLimit: !p.quantityLimit }))}
                              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                                productForm.quantityLimit ? "bg-emerald-500" : "bg-[#1c2840]"
                              }`}
                            >
                              <span
                                className={`block size-5 rounded-full bg-white transition-transform ${
                                  productForm.quantityLimit ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 6. Variáveis Card */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5">
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Variáveis
                        </label>
                        <select
                          value={productForm.selectedVariable}
                          onChange={(e) => setProductForm({ ...productForm, selectedVariable: e.target.value })}
                          className="w-full h-11 px-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-sm text-zinc-400 focus:outline-none focus:border-emerald-500 font-sans"
                        >
                          <option value="">Selecionar variáveis</option>
                          <option value="dias">Dias de VIP (30, 60, 90)</option>
                          <option value="quantidade">Quantidade personalizada</option>
                        </select>
                      </div>

                      {/* 7. Post-Purchase Actions: Comandos / Discord / Chat */}
                      <div className="space-y-3">
                        {/* Sub-tabs header matching CentralCart (Image 1) */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPostPurchaseTab("commands")}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                              postPurchaseTab === "commands"
                                ? "bg-[#0c1220] text-white border border-[#1e2a44] shadow-sm"
                                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                            }`}
                          >
                            <span>Comandos</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                              {productForm.commands.length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPostPurchaseTab("discord")}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                              postPurchaseTab === "discord"
                                ? "bg-[#0c1220] text-white border border-[#1e2a44] shadow-sm"
                                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                            }`}
                          >
                            <span>Discord</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                              1
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPostPurchaseTab("chat")}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                              postPurchaseTab === "chat"
                                ? "bg-[#0c1220] text-white border border-[#1e2a44] shadow-sm"
                                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                            }`}
                          >
                            <span>Chat</span>
                          </button>
                        </div>

                        {/* Card Container */}
                        <div className="rounded-xl border border-[#1c2840] bg-[#070b16] overflow-hidden">
                          {/* Tab Content: Comandos */}
                          {postPurchaseTab === "commands" && (
                            <div className="p-5 space-y-4">
                              {/* Header & Action Buttons (Image 1) */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <h4 className="font-bold text-sm text-white">Comandos</h4>
                                  <p className="text-xs text-zinc-400 mt-0.5">
                                    Configure os comandos que serão executados neste pacote.
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={addEmptyCommand}
                                    className="h-8 px-3.5 rounded-lg bg-[#0e1424] hover:bg-[#162138] border border-[#1c2840] text-xs font-medium text-white transition-colors"
                                  >
                                    Comando vazio
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCmdModalType("item");
                                      setCmdModalTiming("Após a confirmação");
                                      setCmdSearchFilter("");
                                      setIsCmdTypeDropdownOpen(false);
                                      setIsCommandModalOpen(true);
                                    }}
                                    className="h-8 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                                  >
                                    <Plus className="size-3.5" />
                                    <span>Gerar comando</span>
                                  </button>
                                </div>
                              </div>

                              {/* Command rows list (Image 1) */}
                              <div className="space-y-2.5">
                                {productForm.commands.map((cmd, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg bg-[#0a0f1d] border border-[#19243a] hover:border-[#223350] transition-colors"
                                  >
                                    {/* Timing dropdown with colored dot */}
                                    <div className="relative shrink-0">
                                      <select
                                        value={cmd.timing}
                                        onChange={(e) => updateCommandTiming(idx, e.target.value)}
                                        className="appearance-none h-9 pl-3.5 pr-8 rounded-lg bg-[#0e1424] border border-[#1f2b42] text-xs font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                                      >
                                        <option value="Após a confirmação">Após a confirmação 🟢</option>
                                        <option value="Quando expirar">Quando expirar 🟡</option>
                                        <option value="Após uma disputa">Após uma disputa 🔴</option>
                                      </select>
                                      <ChevronDown className="size-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>

                                    {/* Monospace Command Input */}
                                    <input
                                      type="text"
                                      value={cmd.command}
                                      onChange={(e) => updateCommandText(idx, e.target.value)}
                                      placeholder="setvip {client_identifier} paulista 0"
                                      className="flex-1 h-9 px-3.5 rounded-lg bg-[#0e1424] border border-[#1f2b42] text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />

                                    {/* Actions: Settings Gear & Red Trash (Image 1) */}
                                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommandIdx(idx);
                                          setIsRowSettingsModalOpen(true);
                                        }}
                                        className="size-9 rounded-lg bg-[#0e1424] hover:bg-white/10 border border-[#1f2b42] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                                        title="Configurações do Comando"
                                      >
                                        <Settings2 className="size-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeCommand(idx)}
                                        className="size-9 rounded-lg bg-[#e11d48] hover:bg-[#be123c] text-white flex items-center justify-center transition-colors shadow-sm"
                                        title="Excluir Comando"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {productForm.commands.length === 0 && (
                                  <div className="py-8 text-center border border-dashed border-[#1c2840] rounded-lg">
                                    <p className="text-xs text-zinc-500">Nenhum comando configurado para este pacote.</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCmdModalType("item");
                                        setCmdModalTiming("Após a confirmação");
                                        setCmdSearchFilter("");
                                        setIsCmdTypeDropdownOpen(false);
                                        setIsCommandModalOpen(true);
                                      }}
                                      className="mt-2 text-xs text-emerald-400 hover:underline font-semibold"
                                    >
                                      + Gerar primeiro comando
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {postPurchaseTab === "discord" && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-kanit font-bold text-sm text-white flex items-center gap-2">
                                    <span>Discord</span>
                                  </h4>
                                  <p className="text-[11px] text-zinc-500 mt-0.5">
                                    Configure as ações executadas no Discord.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={addDiscordAction}
                                  className="h-8 px-3.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                  <Plus className="size-3.5" />
                                  <span>Adicionar ação</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                {((productForm as any).discordActions && (productForm as any).discordActions.length > 0) ? (
                                  (productForm as any).discordActions.map((act: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 rounded-lg bg-[#0a0f1d] border border-[#162033] p-2 hover:border-[#1e2a44] transition-colors"
                                    >
                                      <div className="relative shrink-0 w-44">
                                        <select
                                          value={act.timing}
                                          onChange={(e) => updateDiscordAction(idx, "timing", e.target.value)}
                                          className="w-full h-9 px-3 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white text-xs font-medium outline-none focus:border-[#ef9f00]"
                                        >
                                          <option value="Após a confirmação">Após a confirmação 🟢</option>
                                          <option value="Quando expirar">Quando expirar 🟡</option>
                                          <option value="Após uma disputa">Após uma disputa 🔴</option>
                                        </select>
                                      </div>

                                      <div className="relative shrink-0 w-44">
                                        <select
                                          value={act.action}
                                          onChange={(e) => updateDiscordAction(idx, "action", e.target.value)}
                                          className="w-full h-9 px-3 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white text-xs font-medium outline-none focus:border-[#ef9f00]"
                                        >
                                          <option value="Adicionar cargo">Adicionar cargo</option>
                                          <option value="Remover cargo">Remover cargo</option>
                                          <option value="Aplicar banimento">Aplicar banimento</option>
                                          <option value="Revogar banimento">Revogar banimento</option>
                                        </select>
                                      </div>

                                      <div className="flex-1 relative">
                                        <input
                                          type="text"
                                          value={act.roleId || ""}
                                          onChange={(e) => updateDiscordAction(idx, "roleId", e.target.value)}
                                          placeholder="ID do cargo (ex: 1547399878425055294)"
                                          list={`discord-roles-list-${idx}`}
                                          className="w-full h-9 px-3 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white text-xs font-mono outline-none focus:border-[#ef9f00]"
                                        />
                                        <datalist id={`discord-roles-list-${idx}`}>
                                          <option value="1520077253281579118">・Doador (Apoiador)</option>
                                          <option value="1547399878425055294">・Vip Policial</option>
                                          <option value="1547399797458083930">・Vip Paulista</option>
                                          <option value="1547399882183155742">・Vip Turista</option>
                                          <option value="1520077254179164401">・Vip Magnata</option>
                                          <option value="1520077255089324203">・Vip Distrito</option>
                                        </datalist>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => removeDiscordAction(idx)}
                                        className="size-9 rounded-lg bg-[#e11d48]/10 hover:bg-[#e11d48] text-[#e11d48] hover:text-white border border-[#e11d48]/20 flex items-center justify-center shrink-0 transition-all"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <div className="rounded-lg border border-dashed border-[#1c2840] p-8 text-center space-y-2">
                                    <p className="text-xs text-zinc-500">
                                      Nenhuma ação do Discord configurada para este produto.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={addDiscordAction}
                                      className="text-xs text-[#ef9f00] hover:underline font-semibold"
                                    >
                                      + Adicionar primeira ação do Discord
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {postPurchaseTab === "chat" && (
                            <div className="p-8 text-center text-xs text-zinc-500">
                              Mensagem global enviada no chat in-game ao confirmar a compra.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 8. Bottom Action Bar */}
                      <div className="flex items-center justify-between pt-4">
                        {editingProductId ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct({ id: editingProductId, name: productForm.name })}
                            className="h-10 px-4 rounded-lg bg-[#271216] border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
                          >
                            Deletar pacote
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsEditingProduct(false)}
                            className="h-10 px-4 rounded-lg bg-[#0e1424] border border-[#1b253b] text-xs font-semibold text-zinc-300 hover:bg-white/5 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="h-10 px-6 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-kanit font-bold text-xs shadow-xl transition-colors"
                          >
                            {editingProductId ? "Editar pacote" : "Criar pacote"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ============================================================ */}
                    {/* RIGHT COLUMN: SIDEBAR METADATA CARDS (~33% WIDTH) */}
                    {/* ============================================================ */}
                    <div className="space-y-4">
                      {/* Card 1: Imagem (opcional) */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5 space-y-3">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Imagem <span className="text-zinc-500 font-normal">(opcional)</span>
                        </label>

                        {/* Image preview with red X button like CentralCart */}
                        <div className="relative rounded-xl border border-[#1c2840] bg-[#080c18] p-3 flex items-center justify-center overflow-hidden group">
                          {productForm.image ? (
                            <>
                              <img
                                src={productForm.image}
                                alt="Preview"
                                className="w-full max-h-56 object-contain rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => setProductForm({ ...productForm, image: "" })}
                                className="absolute top-3 right-3 size-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:bg-rose-700 transition-colors"
                                title="Remover imagem"
                              >
                                <X className="size-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="py-12 text-center text-zinc-500 text-xs">
                              Nenhuma imagem selecionada.
                            </div>
                          )}
                        </div>

                        {/* Image URL input */}
                        <div>
                          <input
                            type="text"
                            value={productForm.image}
                            onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                            placeholder="URL da imagem (CDN CentralCart ou HTTPS)"
                            className="w-full h-10 px-3 rounded-lg bg-[#080c18] border border-[#1c2840] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Card 2: Slug */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5 space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Slug
                        </label>
                        <p className="text-[11px] text-zinc-500 leading-tight">
                          O nome que aparecerá na URL do produto
                        </p>
                        <input
                          type="text"
                          value={productForm.slug}
                          onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                          placeholder="30-coins"
                          className="w-full h-10 px-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Card 3: Visibilidade */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5 space-y-2">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Visibilidade
                        </label>
                        <select
                          value={productForm.isActive ? "visivel" : "oculto"}
                          onChange={(e) =>
                            setProductForm({ ...productForm, isActive: e.target.value === "visivel" })
                          }
                          className="w-full h-10 px-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="visivel">Visível</option>
                          <option value="oculto">Oculto</option>
                        </select>
                      </div>

                      {/* Card 4: Estoque */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-zinc-200">Estoque</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              Ativar estoque deste produto
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProductForm((p) => ({ ...p, stock: !p.stock }))}
                            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                              productForm.stock ? "bg-emerald-500" : "bg-[#1c2840]"
                            }`}
                          >
                            <span
                              className={`block size-5 rounded-full bg-white transition-transform ${
                                productForm.stock ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Card 5: Quantidade mínima */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-zinc-200">Quantidade mínima</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              Definir quantidade mínima de compra
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProductForm((p) => ({ ...p, minQuantity: !p.minQuantity }))}
                            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                              productForm.minQuantity ? "bg-emerald-500" : "bg-[#1c2840]"
                            }`}
                          >
                            <span
                              className={`block size-5 rounded-full bg-white transition-transform ${
                                productForm.minQuantity ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Card 6: Limites */}
                      <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-zinc-200">Limites</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              Permitir apenas uma compra por usuário
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProductForm((p) => ({ ...p, limitPerUser: !p.limitPerUser }))}
                            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                              productForm.limitPerUser ? "bg-emerald-500" : "bg-[#1c2840]"
                            }`}
                          >
                            <span
                              className={`block size-5 rounded-full bg-white transition-transform ${
                                productForm.limitPerUser ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: DASHBOARD OVERVIEW */}
          {/* ============================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-kanit font-bold text-xl text-white">Dashboard Geral</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Visão consolidada das vendas e métricas da loja.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                    <span>PRODUTOS</span>
                    <Package className="size-4 text-emerald-400" />
                  </div>
                  <div className="font-kanit text-2xl font-bold text-white">{stats?.totalProducts ?? products.length}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Pacotes ativos</div>
                </div>

                <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                    <span>CATEGORIAS</span>
                    <Layers className="size-4 text-blue-400" />
                  </div>
                  <div className="font-kanit text-2xl font-bold text-white">{stats?.totalCategories ?? categories.length}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Sessões da loja</div>
                </div>

                <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                    <span>FATURAMENTO</span>
                    <DollarSign className="size-4 text-emerald-400" />
                  </div>
                  <div className="font-kanit text-2xl font-bold text-emerald-400">
                    {formatCurrency(stats?.totalRevenue ?? 0)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">{stats?.paidOrdersCount ?? 0} pagos</div>
                </div>

                <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                    <span>TOTAL PEDIDOS</span>
                    <ShoppingBag className="size-4 text-purple-400" />
                  </div>
                  <div className="font-kanit text-2xl font-bold text-white">{stats?.totalOrders ?? orders.length}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Registrados</div>
                </div>

                <div className="col-span-2 lg:col-span-1 rounded-xl border border-[#162033] bg-[#0b0f1d] p-4">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                    <span>FILA FIVEM</span>
                    <Clock className="size-4 text-amber-400" />
                  </div>
                  <div className="font-kanit text-2xl font-bold text-amber-400">{stats?.pendingDeliveries ?? 0}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Entregas pendentes</div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CATEGORIAS */}
          {/* ============================================================== */}
          {activeTab === "categories" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-kanit font-bold text-xl text-white">Categorias</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Gerencie as categorias exibidas na loja pública.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ id: "", label: "", displayOrder: "0" });
                    setIsCategoryModalOpen(true);
                  }}
                  className="h-10 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-kanit font-bold text-xs flex items-center gap-2"
                >
                  <Plus className="size-4" />
                  <span>NOVA CATEGORIA</span>
                </button>
              </div>

              <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#090d19] border-b border-[#141c2c] text-zinc-400 font-kanit uppercase">
                    <tr>
                      <th className="py-3 px-4">ID (Slug)</th>
                      <th className="py-3 px-4">Nome da Categoria</th>
                      <th className="py-3 px-4">Ordem</th>
                      <th className="py-3 px-4">Produtos Vinculados</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141c2c]">
                    {categories.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-mono text-zinc-400">{c.id}</td>
                        <td className="py-3 px-4 font-bold text-white font-kanit text-sm">{c.label}</td>
                        <td className="py-3 px-4 text-zinc-400">{c.displayOrder || 0}</td>
                        <td className="py-3 px-4 text-zinc-400">{c.productCount || 0} produtos</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategory(c);
                                setCategoryForm({
                                  id: c.id,
                                  label: c.label,
                                  displayOrder: (c.displayOrder || 0).toString(),
                                });
                                setIsCategoryModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                            >
                              <Edit className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id, c.label)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: PEDIDOS */}
          {/* ============================================================== */}
          {activeTab === "orders" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-kanit font-bold text-xl text-white">Pedidos & Vendas</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Histórico completo de transações geradas via Pix Mercado Pago.</p>
              </div>

              <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#090d19] border-b border-[#141c2c] text-zinc-400 font-kanit uppercase">
                    <tr>
                      <th className="py-3 px-4">ID Pedido</th>
                      <th className="py-3 px-4">Passaporte / ID</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Valor Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141c2c]">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-zinc-500">
                          Nenhum pedido registrado ainda.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-mono text-zinc-400">{o.id}</td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">ID #{o.character_id}</td>
                          <td className="py-3 px-4 text-white font-medium">{o.customer_name}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{formatCurrency(o.total_amount)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              o.status === "PAID" || o.status === "DELIVERED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                            {new Date(o.created_at).toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CUPONS */}
          {/* ============================================================== */}
          {activeTab === "coupons" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-kanit font-bold text-xl text-white">Cupons de Desconto</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Crie códigos de desconto com porcentagem aplicável no checkout.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5 space-y-4">
                  <h3 className="font-kanit font-bold text-sm text-white">Criar Novo Cupom</h3>
                  <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-zinc-400 mb-1">CÓDIGO DO CUPOM *</label>
                      <input
                        type="text"
                        value={newCouponForm.code}
                        onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value })}
                        placeholder="Ex: DPRP10"
                        required
                        className="w-full h-10 px-3 rounded-lg bg-[#080c18] border border-[#1c2840] text-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">DESCONTO (%) *</label>
                      <input
                        type="number"
                        value={newCouponForm.discountPercent}
                        onChange={(e) => setNewCouponForm({ ...newCouponForm, discountPercent: e.target.value })}
                        placeholder="10"
                        min={1}
                        max={100}
                        required
                        className="w-full h-10 px-3 rounded-lg bg-[#080c18] border border-[#1c2840] text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">LIMITE DE USOS (OPCIONAL)</label>
                      <input
                        type="number"
                        value={newCouponForm.maxUses}
                        onChange={(e) => setNewCouponForm({ ...newCouponForm, maxUses: e.target.value })}
                        placeholder="500"
                        className="w-full h-10 px-3 rounded-lg bg-[#080c18] border border-[#1c2840] text-white font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full h-10 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-kanit font-bold text-xs shadow-lg transition-colors mt-2"
                    >
                      CRIAR CUPOM
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 rounded-xl border border-[#162033] bg-[#0b0f1d] p-5">
                  <h3 className="font-kanit font-bold text-sm text-white mb-3">Cupons Ativos</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#090d19] border-b border-[#141c2c] text-zinc-400 font-kanit">
                        <tr>
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Desconto</th>
                          <th className="py-2.5 px-3">Usos</th>
                          <th className="py-2.5 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141c2c]">
                        {coupons.map((c) => (
                          <tr key={c.code}>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">{c.code}</td>
                            <td className="py-3 px-3 font-bold text-white">{c.discountPercent}% OFF</td>
                            <td className="py-3 px-3 text-zinc-400">
                              {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : "usos"}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleDeleteCoupon(c.code)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: SEGURANÇA & AUDITORIA */}
          {/* ============================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#162033] bg-gradient-to-r from-emerald-500/10 via-[#0b0f1d] to-blue-500/10 p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        SISTEMA BLINDADO
                      </span>
                    </div>
                    <h3 className="font-kanit font-bold text-xl sm:text-2xl text-white">
                      Central de Segurança & Auditoria do Dono
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                      Painel protegido por Google OAuth 2.0 com trava de 1º proprietário, anti-CSRF e rastreamento imutável de ações.
                    </p>
                  </div>

                  <button
                    onClick={fetchAuditLogs}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-[#162033] hover:bg-white/10 text-xs text-zinc-300"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Atualizar Logs</span>
                  </button>
                </div>
              </div>

              {/* Audit Trail Table */}
              <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5 space-y-4">
                <h4 className="font-kanit font-bold text-sm text-white flex items-center gap-2">
                  <Fingerprint className="size-4 text-emerald-400" />
                  <span>Trilha de Auditoria ao Vivo (Audit Log)</span>
                </h4>

                <div className="overflow-x-auto rounded-lg border border-[#141c2c]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#090d19] text-zinc-400 font-kanit">
                      <tr>
                        <th className="py-3 px-3.5">DATA / HORA</th>
                        <th className="py-3 px-3.5">ADMINISTRADOR</th>
                        <th className="py-3 px-3.5">AÇÃO</th>
                        <th className="py-3 px-3.5">DETALHES</th>
                        <th className="py-3 px-3.5 font-mono">ENDEREÇO IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141c2c]">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500">
                            Nenhum evento registrado ainda.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-3.5 font-mono text-[11px] text-zinc-400">
                              {new Date(log.created_at).toLocaleString("pt-BR")}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-zinc-200">{log.admin_email}</td>
                            <td className="py-3 px-3.5">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-zinc-300 truncate max-w-md">{log.details || "-"}</td>
                            <td className="py-3 px-3.5 font-mono text-[11px] text-zinc-400">{log.ip || "127.0.0.1"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB: CONFIGURAÇÕES & WEBHOOKS DO DISCORD */}
          {/* ============================================================== */}
          {activeTab === ("expirations" as any) && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-kanit font-bold text-white tracking-wide">
                    Assinaturas & Expirações Automáticas
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Monitore os pacotes VIP e temporários ativos. No término do prazo ("remover após"), a loja executa os comandos de remoção (ex: <code className="text-emerald-400 font-mono">removevip</code>) e notifica no Discord.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadExpirations}
                  className="h-9 px-3 rounded-lg bg-[#141b2c] hover:bg-[#1f2b45] text-white text-xs font-semibold flex items-center gap-2 transition-colors self-start"
                >
                  <RefreshCw className={`size-3.5 ${isLoadingExpirations ? "animate-spin" : ""}`} />
                  <span>Atualizar</span>
                </button>
              </div>

              {/* Expirations Table */}
              <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#090d19] border-b border-[#141c2c] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Jogador</th>
                        <th className="px-4 py-3.5">Pacote</th>
                        <th className="px-4 py-3.5">Comandos ao Expirar</th>
                        <th className="px-4 py-3.5">Data de Término</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141c2c] text-zinc-300">
                      {expirations.map((exp) => {
                        const isExpired = new Date(exp.expires_at).getTime() <= Date.now();
                        let parsedCmds: any[] = [];
                        try { parsedCmds = JSON.parse(exp.commands); } catch {}

                        return (
                          <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-white">Passaporte #{exp.character_id}</div>
                              {exp.discord_id && (
                                <div className="text-[11px] text-indigo-400 font-mono">
                                  Discord: {exp.discord_username || exp.discord_id}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-emerald-400">{exp.product_name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">Pedido: {exp.order_id}</div>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-400 max-w-xs truncate">
                              {parsedCmds.map((c: any) => typeof c === "object" ? c.command : c).join("; ") || "removevip"}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-white font-medium">
                                {new Date(exp.expires_at).toLocaleString("pt-BR")}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                Criado em: {new Date(exp.created_at).toLocaleDateString("pt-BR")}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {exp.status === "ACTIVE" ? (
                                isExpired ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                                    VENCEU (Pronto p/ Entrega)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                    ● ATIVO
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-700/40 text-zinc-400">
                                  PROCESSADO
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {exp.status === "ACTIVE" && (
                                <button
                                  type="button"
                                  onClick={() => handleTriggerExpiration(exp.id)}
                                  className="px-2.5 py-1 rounded bg-[#271216] border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold transition-colors"
                                  title="Forçar a expiração imediata para testar a remoção no FiveM e Discord"
                                >
                                  ⚡ Testar Agora
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {expirations.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                            Nenhum plano com expiração ativa no momento. Planos VIP mensais ou com "remover após" configurado aparecerão aqui automaticamente após a confirmação do pagamento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-kanit font-bold text-xl text-white">Configurações da Loja</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Gerencie as integrações da loja, webhooks do Discord e notificações automáticas de vendas.
                </p>
              </div>

              {/* Status Banner */}
              {webhookFeedback && (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-fadeIn ${
                    webhookFeedback.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {webhookFeedback.type === "success" ? (
                      <CheckCircle2 className="size-4 shrink-0" />
                    ) : (
                      <AlertCircle className="size-4 shrink-0" />
                    )}
                    <span>{webhookFeedback.message}</span>
                  </div>
                  <button onClick={() => setWebhookFeedback(null)} className="text-zinc-400 hover:text-white">
                    <X className="size-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6 items-start">
                {/* Form Card */}
                <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-6 space-y-5 shadow-xl">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#141c2c]">
                    <div className="size-10 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
                      <Bell className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-kanit font-bold text-base text-white">
                        Notificação de Vendas (Discord Webhook)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Dispara um Embed idêntico ao da CentralCart quando um pagamento for aprovado.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                        URL do Webhook do Discord *
                      </label>
                      <input
                        type="url"
                        value={discordWebhookUrl}
                        onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/123456789.../abcdef..."
                        className="w-full h-11 px-3.5 rounded-lg bg-[#080c18] border border-[#1c2840] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                      />
                      <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed">
                        <strong>Como obter a URL:</strong> No Discord, abra o canal onde quer receber as vendas &gt;{" "}
                        clique na engrenagem (Editar Canal) &gt; <strong>Integrações</strong> &gt; <strong>Webhooks</strong> &gt; <strong>Novo Webhook</strong> &gt; <strong>Copiar URL do Webhook</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#080c18] border border-[#162033] space-y-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <Check className="size-4 text-emerald-400" />
                        <span>O que é enviado no Embed:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px] pl-1">
                        <li>Nome de todos os pacotes e quantidades compradas</li>
                        <li>Cupom de desconto utilizado (se houver)</li>
                        <li>Forma de pagamento (Mercado Pago / PIX) e valor total</li>
                        <li>Data e horário exato do pagamento em padrão brasileiro</li>
                        <li>Menção direta ao Discord do cliente (se conectado) e ID do Passaporte</li>
                        <li>Banner oficial COMPRA CONCLUÍDA!</li>
                        <li>Botão interativo "Ver pedido"</li>
                      </ul>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        {isSavingSettings ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="size-3.5" />
                            <span>SALVAR CONFIGURAÇÃO</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={isTestingWebhook || !discordWebhookUrl}
                        className="px-4 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-[#5865F2]/20"
                      >
                        {isTestingWebhook ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" />
                            <span>Enviando Teste...</span>
                          </>
                        ) : (
                          <>
                            <Send className="size-3.5" />
                            <span>Enviar Notificação de Teste</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Live Preview Card */}
                <div className="rounded-xl border border-[#162033] bg-[#0b0f1d] p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-[#141c2c]">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Prévia do Discord Embed
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                      #00D26A
                    </span>
                  </div>

                  {/* Discord Mock UI */}
                  <div className="bg-[#2b2d31] p-3 rounded-lg text-white font-sans text-xs space-y-3">
                    {/* Bot header */}
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-[10px] text-black">
                        DP
                      </div>
                      <span className="font-semibold text-xs text-white">Distrito Paulista Bot</span>
                      <span className="bg-[#5865F2] text-[9px] font-bold px-1 rounded text-white">BOT</span>
                      <span className="text-[10px] text-zinc-400">Hoje às 18:16</span>
                    </div>

                    {/* Embed Box */}
                    <div className="border-l-4 border-[#00D26A] bg-[#232428] p-3 rounded-r space-y-2.5 shadow">
                      {/* Author */}
                      <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs">
                        <img src={STORE_CONFIG.logoUrl} alt="" className="size-4 rounded-full" />
                        <span>Distrito Paulista RP</span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-white text-sm">
                        Novo pagamento de R$ 79,80! 🎉
                      </h4>

                      {/* Packages Field */}
                      <div>
                        <div className="text-[11px] font-bold text-zinc-400 mb-0.5">Pacote(s):</div>
                        <pre className="bg-[#1e1f22] p-2 rounded text-[11px] font-mono text-zinc-200 whitespace-pre-wrap border border-white/5">
1x VIP TURISTA (Mensal)
1x 120 GEMAS
                        </pre>
                      </div>

                      {/* Coupon + Gateway + Value Fields */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="font-bold text-zinc-400">Cupom:</span>
                          <pre className="bg-[#1e1f22] p-1.5 rounded font-mono text-zinc-200 mt-0.5 border border-white/5">
NENHUM
                          </pre>
                        </div>
                        <div>
                          <span className="font-bold text-zinc-400">Método de pagamento:</span>
                          <pre className="bg-[#1e1f22] p-1.5 rounded font-mono text-zinc-200 mt-0.5 border border-white/5">
Mercado Pago
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="font-bold text-zinc-400">Valor:</span>
                          <pre className="bg-[#1e1f22] p-1.5 rounded font-mono text-zinc-200 mt-0.5 border border-white/5">
R$ 79,80
                          </pre>
                        </div>
                        <div>
                          <span className="font-bold text-zinc-400">Passaporte:</span>
                          <pre className="bg-[#1e1f22] p-1.5 rounded font-mono text-amber-400 font-bold mt-0.5 border border-white/5">
#136
                          </pre>
                        </div>
                      </div>

                      {/* Date Field */}
                      <div>
                        <div className="text-[11px] font-bold text-zinc-400 mb-0.5">Data de pagamento:</div>
                        <pre className="bg-[#1e1f22] p-1.5 rounded font-mono text-zinc-200 border border-white/5">
08/11/2026 às 18:16
                        </pre>
                      </div>

                      {/* Discord Contact */}
                      <div>
                        <div className="text-[11px] font-bold text-zinc-400 mb-0.5">Contato (Discord):</div>
                        <div className="inline-flex items-center gap-1 bg-[#5865f2]/20 text-[#7983f5] px-2 py-0.5 rounded font-semibold text-xs border border-[#5865f2]/30">
                          @saulo aragao | 1136
                        </div>
                      </div>

                      {/* Compra Concluída Banner Image */}
                      <div className="pt-1 overflow-hidden rounded-md">
                        <img
                          src="/compra-concluida.png"
                          alt="Compra Concluída"
                          className="w-full h-auto rounded-md shadow-md"
                        />
                      </div>

                      {/* Embed Footer */}
                      <div className="pt-1 text-[10px] text-zinc-400 flex items-center gap-1.5">
                        <img src={STORE_CONFIG.logoUrl} alt="" className="size-3.5 rounded-full" />
                        <span>distritopaulista.centralcart.ai</span>
                      </div>
                    </div>

                    {/* Discord Action Button Component */}
                    <div className="pt-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-semibold cursor-pointer shadow">
                        <span>Ver pedido</span>
                        <ExternalLink className="size-3 text-zinc-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      
      {/* Modal: Adicionar comando (CentralCart Signature - Images 2, 3, 4) */}
      {isCommandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1c2840] bg-[#090d19] p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#141c2c]">
              <h3 className="font-bold text-base text-white">
                Adicionar comando
              </h3>
              <button
                type="button"
                onClick={() => setIsCommandModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Field 1: Executar comando (Image 2) */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Executar comando
                </label>
                <div className="relative">
                  <select
                    value={cmdModalTiming}
                    onChange={(e) => setCmdModalTiming(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-medium appearance-none cursor-pointer"
                  >
                    <option value="Após a confirmação">Após a confirmação 🟢</option>
                    <option value="Quando expirar">Quando expirar 🟡</option>
                    <option value="Após uma disputa">Após uma disputa 🔴</option>
                  </select>
                  <ChevronDown className="size-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Field 2: Comando selector with Search (Image 3) */}
              <div className="relative">
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Comando
                </label>

                {/* Trigger button */}
                <button
                  type="button"
                  onClick={() => setIsCmdTypeDropdownOpen(!isCmdTypeDropdownOpen)}
                  className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-left text-white flex items-center justify-between font-medium focus:outline-none focus:border-emerald-500"
                >
                  <span>{COMMAND_OPTIONS.find((c) => c.id === cmdModalType)?.label || "Selecionar comando..."}</span>
                  <ChevronDown className="size-4 text-zinc-400" />
                </button>

                {/* Searchable dropdown menu */}
                {isCmdTypeDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1.5 rounded-xl border border-[#1c2840] bg-[#0c1222] shadow-2xl overflow-hidden max-h-64 flex flex-col">
                    {/* Search input */}
                    <div className="p-2 border-b border-[#141c2c] flex items-center gap-2 bg-[#080d1a]">
                      <Search className="size-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={cmdSearchFilter}
                        onChange={(e) => setCmdSearchFilter(e.target.value)}
                        placeholder="Pesquisar comando..."
                        autoFocus
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                      {cmdSearchFilter && (
                        <button type="button" onClick={() => setCmdSearchFilter("")} className="text-zinc-500 hover:text-white">
                          <X className="size-3" />
                        </button>
                      )}
                    </div>

                    {/* Options list */}
                    <div className="overflow-y-auto p-1 divide-y divide-white/[0.04]">
                      {filteredCommandOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setCmdModalType(opt.id);
                            setIsCmdTypeDropdownOpen(false);
                            setCmdSearchFilter("");
                          }}
                          className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center justify-between ${
                            cmdModalType === opt.id
                              ? "bg-[#18233c] text-white font-semibold"
                              : "text-zinc-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{opt.category}</span>
                        </button>
                      ))}
                      {filteredCommandOptions.length === 0 && (
                        <div className="p-4 text-center text-zinc-500 text-xs">
                          Nenhum comando encontrado.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Dynamic fields depending on command (Image 4) */}
              {cmdModalType === "item" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Nome do item</label>
                    <input
                      type="text"
                      value={cmdItemName}
                      onChange={(e) => setCmdItemName(e.target.value)}
                      placeholder="Ex: repairkit, algemas, weapon_pistol"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Quantidade do item</label>
                    <input
                      type="number"
                      min="1"
                      value={cmdItemAmount}
                      onChange={(e) => setCmdItemAmount(e.target.value)}
                      placeholder="1"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {cmdModalType === "coin" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Quantidade de coins</label>
                    <input
                      type="number"
                      min="1"
                      value={cmdCoinsAmount}
                      onChange={(e) => setCmdCoinsAmount(e.target.value)}
                      placeholder="30"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {cmdModalType === "gema" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Quantidade de gemas</label>
                    <input
                      type="number"
                      min="1"
                      value={cmdGemasAmount}
                      onChange={(e) => setCmdGemasAmount(e.target.value)}
                      placeholder="60"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {cmdModalType === "vip" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Tipo do VIP</label>
                    <select
                      value={cmdVipType}
                      onChange={(e) => setCmdVipType(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
                    >
                      <option value="paulista">paulista</option>
                      <option value="turista">turista</option>
                      <option value="distrito">distrito</option>
                      <option value="magnata">magnata</option>
                      <option value="policial">policial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">
                      Duração (dias) <span className="text-zinc-500 font-normal">(0 = até o wipe, 30 = mensal)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cmdVipDays}
                      onChange={(e) => setCmdVipDays(e.target.value)}
                      placeholder="30"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  {cmdVipDays !== "0" && (
                    <label className="flex items-center gap-2 pt-1 text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cmdVipAutoRemove}
                        onChange={(e) => setCmdVipAutoRemove(e.target.checked)}
                        className="rounded border-[#1c2840] bg-[#0e1424] text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Adicionar comando de remoção automática ao expirar (<code className="text-emerald-400 font-mono">removevip</code>)</span>
                    </label>
                  )}
                </div>
              )}

              {cmdModalType === "money" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Quantidade de dinheiro</label>
                    <input
                      type="number"
                      min="1"
                      value={cmdMoneyAmount}
                      onChange={(e) => setCmdMoneyAmount(e.target.value)}
                      placeholder="100000"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {(cmdModalType === "group_add" || cmdModalType === "group_remove") && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Nome do grupo / cargo</label>
                    <input
                      type="text"
                      value={cmdItemName}
                      onChange={(e) => setCmdItemName(e.target.value)}
                      placeholder="Ex: vip_paulista"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {(cmdModalType === "vehicle_add" || cmdModalType === "vehicle_remove") && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Modelo / Spawn do veículo</label>
                    <input
                      type="text"
                      value={cmdItemName}
                      onChange={(e) => setCmdItemName(e.target.value)}
                      placeholder="Ex: skyline, porsche, bati"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {cmdModalType === "custom" && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Comando customizado</label>
                    <input
                      type="text"
                      value={cmdCustomText}
                      onChange={(e) => setCmdCustomText(e.target.value)}
                      placeholder="Ex: giveitem {client_identifier} colete 1"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Use <code className="text-emerald-400 font-mono">{"{client_identifier}"}</code> para ser substituído pelo ID / CitizenID do jogador.
                    </p>
                  </div>
                </div>
              )}

              {/* Real-time Preview Banner */}
              <div className="rounded-lg bg-[#060913] border border-[#162033] p-3 space-y-1">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Prévia do Comando Qbox
                </div>
                <div className="font-mono text-xs text-emerald-400 break-all">
                  {getGeneratedCommandString()}
                </div>
              </div>

              {/* Modal Footer (Image 4) */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#141c2c]">
                <button
                  type="button"
                  onClick={() => setIsCommandModalOpen(false)}
                  className="h-10 px-4 rounded-lg bg-[#141b2c] hover:bg-[#1f2b45] text-white text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddGeneratedCommand}
                  className="h-10 px-5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors shadow-sm"
                >
                  Adicionar comando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configurações do comando selecionado */}
      {isRowSettingsModalOpen && editingCommandIdx !== null && productForm.commands[editingCommandIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#1c2840] bg-[#090d19] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#141c2c]">
              <h3 className="font-bold text-sm text-white">Configurações do Comando</h3>
              <button
                type="button"
                onClick={() => {
                  setIsRowSettingsModalOpen(false);
                  setEditingCommandIdx(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Executar quando</label>
                <select
                  value={productForm.commands[editingCommandIdx].timing}
                  onChange={(e) => updateCommandTiming(editingCommandIdx, e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white font-medium"
                >
                  <option value="Após a confirmação">Após a confirmação 🟢</option>
                  <option value="Quando expirar">Quando expirar 🟡</option>
                  <option value="Após uma disputa">Após uma disputa 🔴</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Comando a ser executado</label>
                <input
                  type="text"
                  value={productForm.commands[editingCommandIdx].command}
                  onChange={(e) => updateCommandText(editingCommandIdx, e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white font-mono"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRowSettingsModalOpen(false);
                    setEditingCommandIdx(null);
                  }}
                  className="h-9 px-4 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Definir tempo de remoção do produto */}
      {isRemoveAfterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1c2840] bg-[#090d19] p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#141c2c]">
              <div>
                <h3 className="font-bold text-base text-white">Remover do cliente após</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Defina a validade deste produto para execução dos comandos de expiração.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRemoveAfterModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Presets grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Nunca remover", value: "" },
                  { label: "1 dia", value: "1 dia" },
                  { label: "3 dias", value: "3 dias" },
                  { label: "7 dias (1 semana)", value: "7 dias" },
                  { label: "15 dias", value: "15 dias" },
                  { label: "30 dias (1 mês)", value: "30 dias" },
                  { label: "60 dias (2 meses)", value: "60 dias" },
                  { label: "90 dias (3 meses)", value: "90 dias" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setRemoveAfterPreset(preset.value);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      removeAfterPreset === preset.value
                        ? "bg-[#0e2722] border-emerald-500/50 text-emerald-400 font-semibold"
                        : "bg-[#0e1424] border-[#1c2840] text-zinc-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="pt-2 border-t border-[#141c2c] space-y-1.5">
                <label className="block text-zinc-300 font-medium">Ou período personalizado:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={removeAfterCustomNum}
                    onChange={(e) => {
                      setRemoveAfterCustomNum(e.target.value);
                      setRemoveAfterPreset(`${e.target.value} ${removeAfterCustomUnit}`);
                    }}
                    placeholder="30"
                    className="w-24 h-10 px-3 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={removeAfterCustomUnit}
                    onChange={(e) => {
                      setRemoveAfterCustomUnit(e.target.value);
                      setRemoveAfterPreset(`${removeAfterCustomNum} ${e.target.value}`);
                    }}
                    className="flex-1 h-10 px-3 rounded-lg bg-[#0e1424] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="dias">Dias</option>
                    <option value="horas">Horas</option>
                    <option value="minutos">Minutos</option>
                    <option value="meses">Meses</option>
                    <option value="semanas">Semanas</option>
                  </select>
                </div>
              </div>

              {/* Preview Info */}
              <div className="p-3 rounded-lg bg-[#060913] border border-[#162033] flex items-center justify-between">
                <span className="text-zinc-400">Validade selecionada:</span>
                <span className="font-bold text-emerald-400">
                  {removeAfterPreset ? removeAfterPreset : "Nunca remover (Permanente)"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#141c2c]">
                <button
                  type="button"
                  onClick={() => setIsRemoveAfterModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-[#141b2c] hover:bg-[#1f2b45] text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductForm({ ...productForm, removeAfter: removeAfterPreset });
                    setIsRemoveAfterModalOpen(false);
                  }}
                  className="h-9 px-5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold shadow-sm"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Category Create/Edit */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#162033] bg-[#0b0f1d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#141c2c] pb-3">
              <h3 className="font-kanit font-bold text-base text-white">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">NOME DA CATEGORIA *</label>
                <input
                  type="text"
                  value={categoryForm.label}
                  onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                  placeholder="Ex: VEÍCULOS"
                  required
                  className="w-full h-10 px-3 rounded-lg bg-[#080c18] border border-[#1c2840] text-white focus:outline-none focus:border-emerald-500 font-kanit font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">ORDEM DE EXIBIÇÃO</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-[#080c18] border border-[#1c2840] text-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="h-10 px-4 rounded-lg bg-[#0e1424] border border-[#1b253b] text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-kanit font-bold text-xs"
                >
                  {editingCategory ? "SALVAR ALTERAÇÕES" : "CRIAR CATEGORIA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white">
          <RefreshCw className="size-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
