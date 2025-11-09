import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertResearchSchema,
  type InsertResearch,
  type Research,
  ResearchStatus,
  type ResearchStatusType,
  type Jtbd,
} from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TeamAutocomplete } from "./team-autocomplete";
import { JtbdSelector } from "./jtbd-selector";
import { RESEARCH_COLORS } from "@/lib/colors";
import { RequiredFieldIndicator } from "@/components/required-field-indicator";
import { ChevronDown } from "lucide-react";
import { formatDateForInput, parseDateFromInput } from "@/lib/date-utils";
import { addMonths } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WysiwygMarkdownEditor } from "./wysiwyg-markdown-editor";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Checkbox } from "@/components/ui/checkbox";

const PRODUCT_OPTIONS = [
  "CDC Integrations",
  "Lending",
  "Факторинг",
  "Аккредитивы",
  "Гарантии и спец.счета",
  "АДМ",
  "Эквайринг",
  "СБП: B2C, C2B",
  "СБП: B2B",
  "Корпоративные карты",
  "Валютные контракты и платежи",
  "FX",
  "Таможенные карты",
  "Зарплатный проект",
  "Cash Pooling",
  "Рублевые платежи (входящие и исходящие)",
  "Динамическое дисконтирование",
  "IPS: SWAP и РЕПО",
  "IPS: инвест. продукты (акции, облигации и т.д.)",
  "Деривативы",
  "IB: Advisory (M&A, Securitisation), Digital Advisory",
  "CDC Mobile",
  "LORO платежи (рублевые и валютные)",
  "Custody",
  "Специальный Депозитарий",
];

interface ResearchFormProps {
  onSubmit: (data: InsertResearch) => void;
  initialData?: Research | null;
  isLoading?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  onTempDataUpdate?: (data: Partial<InsertResearch>) => void;
}

export default function ResearchForm({
  onSubmit,
  initialData,
  isLoading,
  onCancel,
  onDelete,
  onTempDataUpdate,
}: ResearchFormProps) {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedJtbds, setSelectedJtbds] = useState<Jtbd[]>([]);

  // Log the initial data for debugging
  console.log("Initial data:", initialData);

  // Ensure dates are properly converted to Date objects
  const startDate = initialData?.dateStart
    ? new Date(initialData.dateStart)
    : new Date();

  const endDate = initialData?.dateEnd
    ? new Date(initialData.dateEnd)
    : new Date();

  console.log("Parsed dates:", { startDate, endDate });

  const form = useForm<InsertResearch>({
    resolver: zodResolver(insertResearchSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      team: initialData?.team ?? "",
      researcher: initialData?.researcher ?? "",
      description: initialData?.description ?? "",
      status:
        (initialData?.status as ResearchStatusType) || ResearchStatus.PLANNED,
      dateStart: startDate,
      dateEnd: endDate,
      color: initialData?.color ?? RESEARCH_COLORS[0],
      researchType: (initialData?.researchType as any) || "Not assigned",
      products: initialData?.products ?? [],
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    const newStartDate = initialData?.dateStart
      ? new Date(initialData.dateStart)
      : new Date();

    const newEndDate = initialData?.dateEnd
      ? new Date(initialData.dateEnd)
      : new Date();

    form.reset({
      name: initialData?.name ?? "",
      team: initialData?.team ?? "",
      researcher: initialData?.researcher ?? "",
      description: initialData?.description ?? "",
      status:
        (initialData?.status as ResearchStatusType) || ResearchStatus.PLANNED,
      dateStart: newStartDate,
      dateEnd: newEndDate,
      color: initialData?.color ?? RESEARCH_COLORS[0],
      researchType: (initialData?.researchType as any) || "Not assigned",
      products: initialData?.products ?? [],
    });
  }, [initialData, form]);

  // Handle form field changes to update temporary data
  const handleFieldChange = (field: string, value: any) => {
    if (onTempDataUpdate) {
      onTempDataUpdate({ [field]: value });
    }
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete();
      }
    } catch (error: any) {
      if (error.message?.includes("associated meetings")) {
        setErrorMessage(
          "This research cannot be deleted because it has associated meetings. Please delete all related meetings first.",
        );
        setErrorDialogOpen(true);
      } else {
        setErrorMessage("An error occurred while deleting the research.");
        setErrorDialogOpen(true);
      }
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
          {/* Jobs to be Done section - moved to top as requested */}
          {initialData && initialData.id && (
            <div className="mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-medium">Jobs to be Done</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Добавьте джобу, которая относится к исследованию
              </p>
              <JtbdSelector
                entityId={initialData.id}
                entityType="research"
                selectedJtbds={selectedJtbds}
                onJtbdsChange={setSelectedJtbds}
              />
            </div>
          )}

          {/* Two rows layout for Date/Status/Color fields */}
          <div className="mb-6">
            {/* First row: Start Date and End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="dateStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Старт исследования
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(date) => {
                          if (date) {
                            field.onChange(date);
                            handleFieldChange("dateStart", date);
                            
                            // Автоматически устанавливаем дату окончания на месяц вперед при создании нового исследования
                            const isNewResearch = !initialData?.id;
                            if (isNewResearch) {
                              const oneMonthLater = addMonths(date, 1);
                              form.setValue("dateEnd", oneMonthLater);
                              handleFieldChange("dateEnd", oneMonthLater);
                            }
                          }
                        }}
                        placeholder="дд/мм/гг"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Конец исследования
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(date) => {
                          if (date) {
                            field.onChange(date);
                            handleFieldChange("dateEnd", date);
                          }
                        }}
                        placeholder="дд/мм/гг"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Second row: Status, Research Type, and Color */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Статус
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleFieldChange("status", value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ResearchStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="researchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Тип исследования
                      <RequiredFieldIndicator />
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleFieldChange("researchType", value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип исследования" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CATI (Telephone Survey)">
                          CATI (Telephone Survey)
                        </SelectItem>
                        <SelectItem value="CAWI (Online Survey)">
                          CAWI (Online Survey)
                        </SelectItem>
                        <SelectItem value="Moderated usability testing">
                          Модерируемое юзабилити-тестирование
                        </SelectItem>
                        <SelectItem value="Unmoderated usability testing">
                          Немодерируемое юзабилити-тестирование
                        </SelectItem>
                        <SelectItem value="Co-creation session">
                          Сессия совместного создания
                        </SelectItem>
                        <SelectItem value="Interviews">Интервью</SelectItem>
                        <SelectItem value="Desk research">
                          Кабинетное исследование
                        </SelectItem>
                        <SelectItem value="Not assigned">
                          Не назначено
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Цвет</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full"
                                style={{ backgroundColor: field.value }}
                              />
                              <span>Выбранный цвет</span>
                            </div>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[220px] p-0" align="start">
                        <div className="p-3">
                          <div className="grid grid-cols-4 gap-3">
                            {RESEARCH_COLORS.map((color) => (
                              <div
                                key={color}
                                className="flex justify-center items-center"
                                onClick={() => {
                                  field.onChange(color);
                                  handleFieldChange("color", color);
                                  document.body.click(); // Force the dropdown to close
                                }}
                              >
                                <div
                                  className={`w-7 h-7 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                                    field.value === color
                                      ? "ring-2 ring-primary ring-offset-2"
                                      : "hover:ring-1 hover:ring-gray-300 hover:ring-offset-1"
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Research Name and Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Название исследования
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      
                      className="w-full"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        field.onChange(e);
                        handleFieldChange("name", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Команда
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <TeamAutocomplete
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        handleFieldChange("team", value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="researcher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Исследователь
                    <RequiredFieldIndicator />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      
                      className="w-full"
                      placeholder="Введите имя и фамилию"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const input = e.target.value;
                        // Allow only letters, spaces, and common name characters (hyphens, apostrophes)
                        const filteredInput = input.replace(/[^а-яёА-ЯЁa-zA-Z\s\-']/g, '');
                        
                        // Split by spaces and filter out empty strings
                        const words = filteredInput.split(/\s+/).filter(word => word.length > 0);
                        
                        // Limit to maximum 2 words
                        let validInput = '';
                        if (words.length <= 2) {
                          validInput = filteredInput;
                        } else {
                          // Take only first 2 words and join them
                          validInput = words.slice(0, 2).join(' ');
                        }
                        
                        // Update the field with the validated input
                        const syntheticEvent = { ...e, target: { ...e.target, value: validInput } };
                        field.onChange(syntheticEvent);
                        handleFieldChange("researcher", validInput);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Products field */}
          <div className="mb-6">
            <FormField
              control={form.control}
              name="products"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Продукты</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-auto min-h-[40px] text-left"
                        >
                          <div className="flex flex-wrap gap-1">
                            {field.value && field.value.length > 0 ? (
                              field.value.map((product) => (
                                <span
                                  key={product}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {product}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">
                                Выберите продукты...
                              </span>
                            )}
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="max-h-60 overflow-y-auto p-3">
                        <div className="space-y-2">
                          {PRODUCT_OPTIONS.map((product) => (
                            <div
                              key={product}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={product}
                                checked={
                                  field.value?.includes(product) || false
                                }
                                onCheckedChange={(checked) => {
                                  const currentProducts = field.value || [];
                                  let newProducts;
                                  if (checked) {
                                    newProducts = [...currentProducts, product];
                                  } else {
                                    newProducts = currentProducts.filter(
                                      (p) => p !== product,
                                    );
                                  }
                                  field.onChange(newProducts);
                                  handleFieldChange("products", newProducts);
                                }}
                              />
                              <label
                                htmlFor={product}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {product}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mb-8">
            <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Описание
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div data-color-mode="light">
                      <WysiwygMarkdownEditor
                        value={field.value}
                        onChange={(value) => {
                          const newValue = value || "";
                          field.onChange(newValue);
                          handleFieldChange("description", newValue);
                        }}
                        placeholder="Enter research description..."
                        height={300}
                        className=""
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Removed JTBD section from here - moved to the top */}
          </div>

          {/* Action Buttons - styled for Notion look, matching Meeting form */}
          <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-6 border-t border-gray-100">
            <Button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? "Сохранение..." : "Сохранить исследование"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={onCancel}
                size="sm"
              >
                Отмена
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 ml-auto"
                onClick={handleDelete}
                disabled={isLoading}
                size="sm"
              >
                Удалить исследование
              </Button>
            )}
          </div>
        </form>
      </Form>

      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
