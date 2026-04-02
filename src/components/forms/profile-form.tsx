"use client";

import { useMemo, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/forms/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  activitiesStatusOptions,
  applicationInterestOptions,
  clinicalExperienceOptions,
  currentYearOptions,
  highestLeadershipLevelOptions,
  letterStrengthOptions,
  personalStatementStatusOptions,
  researchTypeOptions,
  schoolListStatusOptions,
  schoolRigorOptions,
  serviceCategoryOptions,
  stateOptions,
} from "@/lib/options";
import {
  emptyProfileValues,
  premedProfileSchema,
  type PremedProfileFormValues,
} from "@/lib/validation/premed-profile";
import { cn } from "@/lib/utils";

type ProfileFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<PremedProfileFormValues>;
  profileId?: string;
};

function parseNumberInput(value: unknown, fallback?: number) {
  if (typeof value === "number") {
    return Number.isNaN(value) ? fallback : value;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const requiredNumberFieldOptions = {
  setValueAs: (value: unknown) => parseNumberInput(value),
};

const zeroNumberFieldOptions = {
  setValueAs: (value: unknown) => parseNumberInput(value, 0),
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function FieldGroup({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function CheckboxChip({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition",
        checked
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="size-4 rounded border-border"
      />
      <span>{label}</span>
    </label>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ProfileForm({
  mode,
  initialValues,
  profileId,
}: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo(
    () => ({
      ...emptyProfileValues,
      ...initialValues,
    }),
    [initialValues],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PremedProfileFormValues>({
    resolver: zodResolver(premedProfileSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const endpoint =
        mode === "create" ? "/api/profiles" : `/api/profiles/${profileId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const submissionValues = {
        ...defaultValues,
        ...values,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionValues),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error ?? "Unable to save profile.");
        return;
      }

      toast.success(
        mode === "create" ? "Profile saved." : "Profile updated successfully.",
      );
      router.push(`/results/${payload.profile.id}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          This version focuses on comparable stats, hours, counts, and a few
          structured preferences. Free-response narrative fields were removed from
          scoring so the output stays grounded in measurable inputs.
        </p>
      </div>

      <SectionCard
        title="Basic Context"
        description="Only the core profile fields needed to identify and contextualize the snapshot."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FieldGroup label="Full name" error={errors.fullName?.message}>
            <Input {...register("fullName")} placeholder="Alex Morgan" />
          </FieldGroup>
          <FieldGroup label="Email" error={errors.email?.message}>
            <Input
              {...register("email")}
              type="email"
              placeholder="alex@example.com"
            />
          </FieldGroup>
          <FieldGroup
            label="State of residence"
            error={errors.stateOfResidence?.message}
          >
            <input
              list="states"
              {...register("stateOfResidence")}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="North Carolina"
            />
            <datalist id="states">
              {stateOptions.map((state) => (
                <option key={state} value={state} />
              ))}
            </datalist>
          </FieldGroup>
          <FieldGroup label="College name" error={errors.collegeName?.message}>
            <Input
              {...register("collegeName")}
              placeholder="University of Michigan"
            />
          </FieldGroup>
          <FieldGroup
            label="Graduation year"
            error={errors.graduationYear?.message}
          >
            <Input
              {...register("graduationYear", requiredNumberFieldOptions)}
              type="number"
              min={2000}
              max={2055}
            />
          </FieldGroup>
          <FieldGroup
            label="Current year in school"
            error={errors.currentYear?.message}
          >
            <Controller
              control={control}
              name="currentYear"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={currentYearOptions}
                />
              )}
            />
          </FieldGroup>
          <FieldGroup label="Major" error={errors.major?.message}>
            <Input {...register("major")} placeholder="Biology" />
          </FieldGroup>
          <FieldGroup label="Honors program">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input
                type="checkbox"
                {...register("honorsProgram")}
                className="size-4"
              />
              <span className="text-sm">Participated in an honors program</span>
            </label>
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Academics"
        description="The model compares GPA, MCAT, withdrawals, low grades, and academic context."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldGroup
            label="Cumulative GPA"
            error={errors.cumulativeGpa?.message}
          >
            <Input
              {...register("cumulativeGpa", requiredNumberFieldOptions)}
              type="number"
              step="0.01"
              min={0}
              max={4}
            />
          </FieldGroup>
          <FieldGroup label="Science GPA" error={errors.scienceGpa?.message}>
            <Input
              {...register("scienceGpa", requiredNumberFieldOptions)}
              type="number"
              step="0.01"
              min={0}
              max={4}
            />
          </FieldGroup>
          <FieldGroup label="MCAT total" error={errors.mcatTotal?.message}>
            <Input
              {...register("mcatTotal", zeroNumberFieldOptions)}
              type="number"
              min={0}
              max={528}
            />
          </FieldGroup>
          <FieldGroup label="School rigor" error={errors.schoolRigor?.message}>
            <Controller
              control={control}
              name="schoolRigor"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={schoolRigorOptions}
                />
              )}
            />
          </FieldGroup>
          <FieldGroup label="Chem/Phys" error={errors.mcatChemPhys?.message}>
            <Input
              {...register("mcatChemPhys", zeroNumberFieldOptions)}
              type="number"
              min={0}
              max={132}
            />
          </FieldGroup>
          <FieldGroup label="CARS" error={errors.mcatCars?.message}>
            <Input
              {...register("mcatCars", zeroNumberFieldOptions)}
              type="number"
              min={0}
              max={132}
            />
          </FieldGroup>
          <FieldGroup
            label="Bio/Biochem"
            error={errors.mcatBioBiochem?.message}
          >
            <Input
              {...register("mcatBioBiochem", zeroNumberFieldOptions)}
              type="number"
              min={0}
              max={132}
            />
          </FieldGroup>
          <FieldGroup label="Psych/Soc" error={errors.mcatPsychSoc?.message}>
            <Input
              {...register("mcatPsychSoc", zeroNumberFieldOptions)}
              type="number"
              min={0}
              max={132}
            />
          </FieldGroup>
          <FieldGroup
            label="Number of W's"
            error={errors.numberOfWithdrawals?.message}
          >
            <Input
              {...register("numberOfWithdrawals", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="C's or below"
            error={errors.numberOfCsOrLower?.message}
          >
            <Input
              {...register("numberOfCsOrLower", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup label="Upward grade trend">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input
                type="checkbox"
                {...register("upwardGradeTrend")}
                className="size-4"
              />
              <span className="text-sm">Grades trend upward over time</span>
            </label>
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Clinical Exposure"
        description="Hours and role breadth are scored here. Blank hour fields save as 0."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FieldGroup
            label="Paid clinical hours"
            error={errors.paidClinicalHours?.message}
          >
            <Input
              {...register("paidClinicalHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Clinical volunteer hours"
            error={errors.clinicalVolunteerHours?.message}
          >
            <Input
              {...register("clinicalVolunteerHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Patient-facing hours"
            error={errors.patientFacingHours?.message}
          >
            <Input
              {...register("patientFacingHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
        </div>
        <FieldGroup
          label="Clinical role types"
          description="Select the clinical settings you actually have. The model uses the count for breadth."
        >
          <Controller
            control={control}
            name="clinicalExperienceTypes"
            render={({ field }) => (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {clinicalExperienceOptions.map((option) => (
                  <CheckboxChip
                    key={option}
                    label={option}
                    checked={(field.value ?? []).includes(option)}
                    onToggle={() =>
                      field.onChange(
                        (field.value ?? []).includes(option)
                          ? (field.value ?? []).filter((value) => value !== option)
                          : [...(field.value ?? []), option],
                      )
                    }
                  />
                ))}
              </div>
            )}
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title="Shadowing"
        description="Purely quantitative shadowing inputs: total hours, physician count, and primary-care exposure."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <FieldGroup
            label="Total hours"
            error={errors.shadowingTotalHours?.message}
          >
            <Input
              {...register("shadowingTotalHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Physicians shadowed"
            error={errors.physiciansShadowed?.message}
          >
            <Input
              {...register("physiciansShadowed", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Primary care hours"
            error={errors.primaryCareShadowingHours?.message}
          >
            <Input
              {...register("primaryCareShadowingHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Specialty hours"
            error={errors.specialtyShadowingHours?.message}
          >
            <Input
              {...register("specialtyShadowingHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Virtual hours"
            error={errors.virtualShadowingHours?.message}
          >
            <Input
              {...register("virtualShadowingHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Research"
        description="The model compares time, project count, and outputs. It does not compare research essays."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldGroup
            label="Total research hours"
            error={errors.researchHours?.message}
          >
            <Input
              {...register("researchHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Labs/projects"
            error={errors.researchProjectsCount?.message}
          >
            <Input
              {...register("researchProjectsCount", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup label="Research type" error={errors.researchType?.message}>
            <Controller
              control={control}
              name="researchType"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={researchTypeOptions}
                />
              )}
            />
          </FieldGroup>
          <FieldGroup
            label="Posters/presentations"
            error={errors.postersPresentationsCount?.message}
          >
            <Input
              {...register("postersPresentationsCount", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Publications"
            error={errors.publicationsCount?.message}
          >
            <Input
              {...register("publicationsCount", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup label="Abstracts" error={errors.abstractsCount?.message}>
            <Input
              {...register("abstractsCount", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Service"
        description="Service scoring is based on hours, underserved exposure, leadership, and category breadth."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FieldGroup
            label="Total service hours"
            error={errors.nonClinicalVolunteerHours?.message}
          >
            <Input
              {...register("nonClinicalVolunteerHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Underserved hours"
            error={errors.underservedServiceHours?.message}
          >
            <Input
              {...register("underservedServiceHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup label="Leadership in service roles">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input
                type="checkbox"
                {...register("serviceLeadership")}
                className="size-4"
              />
              <span className="text-sm">Held leadership in service settings</span>
            </label>
          </FieldGroup>
        </div>
        <FieldGroup
          label="Service categories"
          description="Select the service lanes you have meaningful hours in."
        >
          <Controller
            control={control}
            name="serviceCategories"
            render={({ field }) => (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {serviceCategoryOptions.map((option) => (
                  <CheckboxChip
                    key={option}
                    label={option}
                    checked={(field.value ?? []).includes(option)}
                    onToggle={() =>
                      field.onChange(
                        (field.value ?? []).includes(option)
                          ? (field.value ?? []).filter((value) => value !== option)
                          : [...(field.value ?? []), option],
                      )
                    }
                  />
                ))}
              </div>
            )}
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title="Leadership And Employment"
        description="Leadership and work context remain scored, but only through measurable involvement and responsibility."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldGroup
            label="Leadership hours"
            error={errors.leadershipHours?.message}
          >
            <Input
              {...register("leadershipHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Leadership roles"
            error={errors.leadershipRolesCount?.message}
          >
            <Input
              {...register("leadershipRolesCount", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Highest leadership level"
            error={errors.highestLeadershipLevel?.message}
          >
            <Controller
              control={control}
              name="highestLeadershipLevel"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={highestLeadershipLevelOptions}
                />
              )}
            />
          </FieldGroup>
          <FieldGroup
            label="Paid non-clinical work hours"
            error={errors.paidNonClinicalWorkHours?.message}
          >
            <Input
              {...register("paidNonClinicalWorkHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Paid clinical work hours"
            error={errors.paidClinicalWorkHours?.message}
          >
            <Input
              {...register("paidClinicalWorkHours", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup label="Employment while in school">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input
                type="checkbox"
                {...register("employmentWhileInSchool")}
                className="size-4"
              />
              <span className="text-sm">Worked while enrolled</span>
            </label>
          </FieldGroup>
          <FieldGroup label="Worked during semesters">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input
                type="checkbox"
                {...register("workedDuringSemesters")}
                className="size-4"
              />
              <span className="text-sm">Worked during active semesters</span>
            </label>
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Application Readiness"
        description="These are still comparable because the model maps each status to a fixed readiness score."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldGroup
            label="Planned application cycle"
            error={errors.plannedApplicationCycle?.message}
          >
            <Input {...register("plannedApplicationCycle")} placeholder="2027" />
          </FieldGroup>
          <FieldGroup
            label="Planned school list size"
            error={errors.plannedSchoolListSize?.message}
          >
            <Input
              {...register("plannedSchoolListSize", zeroNumberFieldOptions)}
              type="number"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Interested in"
            error={errors.applicationInterest?.message}
          >
            <Controller
              control={control}
              name="applicationInterest"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={applicationInterestOptions}
                />
              )}
            />
          </FieldGroup>
          <FieldGroup label="Letter strength" error={errors.letterStrength?.message}>
            <Controller
              control={control}
              name="letterStrength"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={letterStrengthOptions}
                />
              )}
            />
          </FieldGroup>
          <FieldGroup
            label="Personal statement"
            error={errors.personalStatementReadiness?.message}
          >
            <Controller
              control={control}
              name="personalStatementReadiness"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={personalStatementStatusOptions}
                />
              )}
            />
          </FieldGroup>
          <FieldGroup
            label="Activities section"
            error={errors.activitiesReadiness?.message}
          >
            <Controller
              control={control}
              name="activitiesReadiness"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={activitiesStatusOptions}
                />
              )}
            />
          </FieldGroup>
          <FieldGroup
            label="School list"
            error={errors.schoolListReadiness?.message}
          >
            <Controller
              control={control}
              name="schoolListReadiness"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  options={schoolListStatusOptions}
                />
              )}
            />
          </FieldGroup>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="School-list preference flags">
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-4">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  {...register("researchHeavyPreference")}
                  className="size-4"
                />
                Research-heavy school preference
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  {...register("serviceHeavyPreference")}
                  className="size-4"
                />
                Community/service-heavy school preference
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  {...register("stateSchoolPriority")}
                  className="size-4"
                />
                State school priority
              </label>
            </div>
          </FieldGroup>
        </div>
      </SectionCard>

      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium">Ready to score this profile?</p>
          <p className="text-sm text-muted-foreground">
            Saving compares your stats against the benchmark targets and updates
            the gap-year estimate.
          </p>
        </div>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {mode === "create" ? "Save Profile And Score" : "Update Profile"}
        </Button>
      </div>
    </form>
  );
}
