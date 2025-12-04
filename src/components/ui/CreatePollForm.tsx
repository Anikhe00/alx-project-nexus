import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  GripVertical,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePollsContext } from "@/context/PollsContext";

// Validation schema
const pollSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title too long"),
    description: z.string().max(500, "Description too long").optional(),
    options: z
      .array(
        z.object({
          text: z
            .string()
            .min(1, "Option cannot be empty")
            .max(100, "Option too long"),
        })
      )
      .min(2, "At least 2 options required")
      .max(10, "Maximum 10 options allowed"),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type PollFormData = z.infer<typeof pollSchema>;

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePollModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePollModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { refreshPolls } = usePollsContext();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PollFormData>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: "",
      description: "",
      options: [{ text: "" }, { text: "" }],
      startDate: undefined,
      endDate: undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const title = watch("title");
  const options = watch("options");

  const handleClose = () => {
    reset();
    setCurrentStep(1);
    onClose();
  };

  const onSubmit = async (data: PollFormData) => {
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to create a poll");
        return;
      }

      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          title: data.title,
          description: data.description || null,
          start_at: data.startDate ? data.startDate.toISOString() : null,
          end_at: data.endDate ? data.endDate.toISOString() : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options
      const optionsToInsert = data.options.map((option) => ({
        poll_id: poll.id,
        label: option.text,
        image_url: null,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      toast.success("Poll created successfully!");

      // 3. THIS IS THE KEY FIX: Refresh the global list immediately
      await refreshPolls();

      handleClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating poll:", error);
      toast.error(error.message || "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOption = () => {
    if (fields.length < 10) {
      append({ text: "" });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  const isStep1Valid = title.length >= 3;
  const isStep2Valid =
    options.every((opt) => opt.text.length > 0) && options.length >= 2;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-2xl font-semibold font-grotesk text-neutral-800">
              Create New Poll
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Step {currentStep} of 3
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                      currentStep >= step
                        ? "bg-teal-600 text-white"
                        : "bg-neutral-200 text-neutral-500"
                    )}
                  >
                    {step}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium hidden sm:block",
                      currentStep >= step
                        ? "text-neutral-800"
                        : "text-neutral-500"
                    )}
                  >
                    {step === 1 && "Details"}
                    {step === 2 && "Options"}
                    {step === 3 && "Schedule"}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "h-1 flex-1 mx-2 rounded transition-colors",
                      currentStep > step ? "bg-teal-600" : "bg-neutral-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // handleSubmit is called in the button onClick
          }}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-base font-semibold">
                    Poll Title <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-neutral-500 mb-3">
                    Write a clear, engaging question
                  </p>
                  <Input
                    id="title"
                    placeholder="e.g., What's your favorite programming language?"
                    {...register("title")}
                    className={cn(
                      "text-base",
                      errors.title && "border-red-500"
                    )}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold"
                  >
                    Description (Optional)
                  </Label>
                  <p className="text-sm text-neutral-500 mb-3">
                    Add context or additional information
                  </p>
                  <Textarea
                    id="description"
                    placeholder="Provide more details about your poll..."
                    rows={4}
                    {...register("description")}
                    className={cn(errors.description && "border-red-500")}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">
                    Poll Options <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-neutral-500 mb-4">
                    Add 2-10 options for people to choose from
                  </p>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-neutral-400">
                          <GripVertical className="w-4 h-4" />
                          <span className="text-sm font-medium w-6">
                            {index + 1}
                          </span>
                        </div>
                        <Input
                          placeholder={`Option ${index + 1}`}
                          {...register(`options.${index}.text`)}
                          className={cn(
                            "flex-1",
                            errors.options?.[index] && "border-red-500"
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                          disabled={fields.length <= 2}
                          className={cn(
                            "shrink-0",
                            fields.length <= 2 &&
                              "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {errors.options && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.options.message || "Please fill in all options"}
                    </p>
                  )}

                  {fields.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddOption}
                      className="w-full mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  )}

                  <div className="flex items-center justify-between text-sm text-neutral-500 mt-4">
                    <span>{fields.length} / 10 options</span>
                    <Badge variant="outline">
                      {fields.length >= 2 ? "Ready" : "Add more options"}
                    </Badge>
                  </div>
                </div>

                <Card className="p-4 bg-neutral-50 border-2 border-dashed">
                  <h3 className="text-sm font-semibold text-neutral-800 mb-3">
                    Preview
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium text-neutral-800">
                      {title || "Your poll question..."}
                    </p>
                    {options
                      .filter((opt) => opt.text)
                      .map((opt, idx) => (
                        <div
                          key={idx}
                          className="bg-white border rounded-lg px-3 py-2 text-sm"
                        >
                          {opt.text}
                        </div>
                      ))}
                  </div>
                </Card>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">
                    Poll Schedule (Optional)
                  </Label>
                  <p className="text-sm text-neutral-500 mb-4">
                    Set when your poll starts and ends
                  </p>

                  <div className="grid gap-4">
                    <div>
                      <Label className="text-sm mb-2 block">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-neutral-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate
                              ? format(startDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => setValue("startDate", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-sm mb-2 block">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-neutral-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => setValue("endDate", date)}
                            disabled={(date) =>
                              startDate ? date < startDate : false
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {errors.endDate && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.endDate.message}
                    </p>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Schedule Summary
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          {startDate && endDate
                            ? `Poll will run from ${format(
                                startDate,
                                "MMM d, yyyy"
                              )} to ${format(endDate, "MMM d, yyyy")}`
                            : startDate
                            ? `Poll starts ${format(
                                startDate,
                                "MMM d, yyyy"
                              )} (no end date)`
                            : "Poll starts immediately (no end date)"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 p-4">
            <div className="flex justify-between gap-3">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid)
                  }
                  className="bg-teal-600 hover:bg-teal-500"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-500"
                >
                  {isSubmitting ? "Creating..." : "Create Poll"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
