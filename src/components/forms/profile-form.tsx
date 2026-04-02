"use client";

import { useMemo, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/forms/section-card";
import { TagInput } from "@/components/forms/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const numberFieldOptions = {
  setValueAs: (value: unknown) => {
    if (typeof value === "number") {
      return Number.isNaN(value) ? undefined : value;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : Number(trimmed);
  },
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
      const endpoint = mode === "create" ? "/api/profiles" : `/api/profiles/${profileId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
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
          This tool estimates readiness using transparent benchmarks. It does not
          guarantee admission, and medical school admissions remain holistic.
        </p>
      </div>

      <SectionCard
        title="Basic Info"
        description="Core identity, school stage, and planning context."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FieldGroup label="Full name" error={errors.fullName?.message}>
            <Input {...register("fullName")} placeholder="Alex Morgan" />
          </FieldGroup>
          <FieldGroup label="Email" error={errors.email?.message}>
            <Input {...register("email")} type="email" placeholder="alex@example.com" />
          </FieldGroup>
          <FieldGroup label="State of residence" error={errors.stateOfResidence?.message}>
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
            <Input {...register("collegeName")} placeholder="University of Michigan" />
          </FieldGroup>
          <FieldGroup label="Graduation year" error={errors.graduationYear?.message}>
            <Input
              {...register("graduationYear", numberFieldOptions)}
              type="number"
            />
          </FieldGroup>
          <FieldGroup label="Current year in school" error={errors.currentYear?.message}>
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
          <FieldGroup label="Minor" error={errors.minor?.message}>
            <Input {...register("minor")} placeholder="Spanish" />
          </FieldGroup>
          <FieldGroup label="Honors program">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input type="checkbox" {...register("honorsProgram")} className="size-4" />
              <span className="text-sm">Participated in an honors program</span>
            </label>
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Academics"
        description="Numbers matter here, but the model still considers context and trajectory."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldGroup label="Cumulative GPA" error={errors.cumulativeGpa?.message}>
            <Input {...register("cumulativeGpa", numberFieldOptions)} type="number" step="0.01" />
          </FieldGroup>
          <FieldGroup label="Science GPA" error={errors.scienceGpa?.message}>
            <Input {...register("scienceGpa", numberFieldOptions)} type="number" step="0.01" />
          </FieldGroup>
          <FieldGroup label="MCAT total" error={errors.mcatTotal?.message}>
            <Input {...register("mcatTotal", numberFieldOptions)} type="number" />
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
            <Input {...register("mcatChemPhys", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="CARS" error={errors.mcatCars?.message}>
            <Input {...register("mcatCars", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Bio/Biochem" error={errors.mcatBioBiochem?.message}>
            <Input {...register("mcatBioBiochem", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Psych/Soc" error={errors.mcatPsychSoc?.message}>
            <Input {...register("mcatPsychSoc", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Number of W's" error={errors.numberOfWithdrawals?.message}>
            <Input {...register("numberOfWithdrawals", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="C's or below" error={errors.numberOfCsOrLower?.message}>
            <Input {...register("numberOfCsOrLower", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Upward grade trend">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input type="checkbox" {...register("upwardGradeTrend")} className="size-4" />
              <span className="text-sm">Grades trend upward over time</span>
            </label>
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard
        title="Clinical Experience"
        description="The tool values patient-facing time, variety, and clearly articulated impact."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FieldGroup label="Paid clinical hours" error={errors.paidClinicalHours?.message}>
            <Input {...register("paidClinicalHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Clinical volunteer hours" error={errors.clinicalVolunteerHours?.message}>
            <Input {...register("clinicalVolunteerHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Patient-facing hours" error={errors.patientFacingHours?.message}>
            <Input {...register("patientFacingHours", numberFieldOptions)} type="number" />
          </FieldGroup>
        </div>
        <FieldGroup label="Clinical experience types">
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
        <FieldGroup label="Custom clinical types">
          <Controller
            control={control}
            name="customClinicalExperienceTypes"
            render={({ field }) => (
              <TagInput
                values={field.value ?? []}
                onChange={field.onChange}
                placeholder="Add custom clinical roles"
              />
            )}
          />
        </FieldGroup>
        <FieldGroup
          label="Most meaningful clinical role description"
          error={errors.clinicalRoleDescription?.message}
        >
          <Textarea
            {...register("clinicalRoleDescription")}
            rows={4}
            placeholder="Describe your most meaningful clinical role and what you learned."
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title="Shadowing"
        description="Schools want to see exposure to physicians, especially some primary care context."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <FieldGroup label="Total hours" error={errors.shadowingTotalHours?.message}>
            <Input {...register("shadowingTotalHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Physicians shadowed" error={errors.physiciansShadowed?.message}>
            <Input {...register("physiciansShadowed", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Primary care hours" error={errors.primaryCareShadowingHours?.message}>
            <Input {...register("primaryCareShadowingHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Specialty hours" error={errors.specialtyShadowingHours?.message}>
            <Input {...register("specialtyShadowingHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Virtual hours" error={errors.virtualShadowingHours?.message}>
            <Input {...register("virtualShadowingHours", numberFieldOptions)} type="number" />
          </FieldGroup>
        </div>
        <FieldGroup label="Most meaningful shadowing reflection" error={errors.shadowingReflection?.message}>
          <Textarea
            {...register("shadowingReflection")}
            rows={4}
            placeholder="Reflect on what shadowing taught you about the physician role."
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title="Research"
        description="Research is flexible for many schools, but it matters more for research-heavy lists."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldGroup label="Total research hours" error={errors.researchHours?.message}>
            <Input {...register("researchHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Labs/projects" error={errors.researchProjectsCount?.message}>
            <Input {...register("researchProjectsCount", numberFieldOptions)} type="number" />
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
          <FieldGroup label="Posters/presentations" error={errors.postersPresentationsCount?.message}>
            <Input {...register("postersPresentationsCount", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Publications" error={errors.publicationsCount?.message}>
            <Input {...register("publicationsCount", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Abstracts" error={errors.abstractsCount?.message}>
            <Input {...register("abstractsCount", numberFieldOptions)} type="number" />
          </FieldGroup>
        </div>
        <FieldGroup label="Most meaningful research contribution" error={errors.researchContribution?.message}>
          <Textarea
            {...register("researchContribution")}
            rows={4}
            placeholder="Describe the contribution you made and what you learned from it."
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title="Service"
        description="Non-clinical service and underserved engagement carry real weight, especially for service-oriented school lists."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FieldGroup label="Total service hours" error={errors.nonClinicalVolunteerHours?.message}>
            <Input {...register("nonClinicalVolunteerHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Underserved hours" error={errors.underservedServiceHours?.message}>
            <Input {...register("underservedServiceHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Leadership in service roles">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input type="checkbox" {...register("serviceLeadership")} className="size-4" />
              <span className="text-sm">Held leadership in service settings</span>
            </label>
          </FieldGroup>
        </div>
        <FieldGroup label="Service categories">
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
        <FieldGroup label="Custom service categories">
          <Controller
            control={control}
            name="customServiceCategories"
            render={({ field }) => (
              <TagInput
                values={field.value ?? []}
                onChange={field.onChange}
                placeholder="Add custom service areas"
              />
            )}
          />
        </FieldGroup>
        <FieldGroup label="Most meaningful service experience" error={errors.serviceExperience?.message}>
          <Textarea
            {...register("serviceExperience")}
            rows={4}
            placeholder="Describe the service role, who you served, and what mattered most."
          />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title="Leadership And Employment"
        description="Leadership and employment add context for responsibility, initiative, and time management."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldGroup label="Leadership hours" error={errors.leadershipHours?.message}>
            <Input {...register("leadershipHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Leadership roles" error={errors.leadershipRolesCount?.message}>
            <Input {...register("leadershipRolesCount", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Highest leadership level" error={errors.highestLeadershipLevel?.message}>
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
          <FieldGroup label="Paid non-clinical work hours" error={errors.paidNonClinicalWorkHours?.message}>
            <Input {...register("paidNonClinicalWorkHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Paid clinical work hours" error={errors.paidClinicalWorkHours?.message}>
            <Input {...register("paidClinicalWorkHours", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Employment while in school">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input type="checkbox" {...register("employmentWhileInSchool")} className="size-4" />
              <span className="text-sm">Worked while enrolled</span>
            </label>
          </FieldGroup>
          <FieldGroup label="Worked during semesters">
            <label className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
              <input type="checkbox" {...register("workedDuringSemesters")} className="size-4" />
              <span className="text-sm">Worked during active semesters</span>
            </label>
          </FieldGroup>
        </div>
        <FieldGroup label="Most meaningful leadership role" error={errors.leadershipDescription?.message}>
          <Textarea {...register("leadershipDescription")} rows={3} />
        </FieldGroup>
        <FieldGroup label="Most meaningful job description" error={errors.jobDescription?.message}>
          <Textarea {...register("jobDescription")} rows={3} />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title="Extracurriculars"
        description="Long-term commitments and distinctive interests help the model explain how your profile stands out."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FieldGroup label="Clubs and organizations">
            <Controller
              control={control}
            name="clubsOrganizations"
            render={({ field }) => (
                <TagInput values={field.value ?? []} onChange={field.onChange} placeholder="Pre-med society, AMSA, etc." />
              )}
            />
          </FieldGroup>
          <FieldGroup label="Hobbies and interests">
            <Controller
              control={control}
            name="hobbiesInterests"
            render={({ field }) => (
                <TagInput values={field.value ?? []} onChange={field.onChange} placeholder="Running, cooking, language learning..." />
              )}
            />
          </FieldGroup>
          <FieldGroup label="Sports">
            <Controller
              control={control}
            name="sports"
            render={({ field }) => (
                <TagInput values={field.value ?? []} onChange={field.onChange} placeholder="Club soccer, marathon training..." />
              )}
            />
          </FieldGroup>
          <FieldGroup label="Creative activities">
            <Controller
              control={control}
            name="creativeActivities"
            render={({ field }) => (
                <TagInput values={field.value ?? []} onChange={field.onChange} placeholder="Music, photography, design..." />
              )}
            />
          </FieldGroup>
          <FieldGroup label="Other long-term commitments">
            <Controller
              control={control}
            name="longTermCommitments"
            render={({ field }) => (
                <TagInput values={field.value ?? []} onChange={field.onChange} placeholder="Family caregiving, church leadership..." />
              )}
            />
          </FieldGroup>
        </div>
        <FieldGroup label="Distinctiveness factor" error={errors.distinctivenessFactor?.message}>
          <Textarea {...register("distinctivenessFactor")} rows={3} placeholder="What feels most distinctive about your profile?" />
        </FieldGroup>
        <FieldGroup label="Gap year plans" error={errors.gapYearPlans?.message}>
          <Textarea {...register("gapYearPlans")} rows={3} placeholder="Describe any planned gap year activities or uncertainty." />
        </FieldGroup>
      </SectionCard>

      <SectionCard
        title="Application Readiness"
        description="This section measures how executable your intended cycle looks right now."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldGroup label="Planned application cycle" error={errors.plannedApplicationCycle?.message}>
            <Input {...register("plannedApplicationCycle")} placeholder="2027 cycle" />
          </FieldGroup>
          <FieldGroup label="Planned school list size" error={errors.plannedSchoolListSize?.message}>
            <Input {...register("plannedSchoolListSize", numberFieldOptions)} type="number" />
          </FieldGroup>
          <FieldGroup label="Interested in" error={errors.applicationInterest?.message}>
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
          <FieldGroup label="Personal statement" error={errors.personalStatementReadiness?.message}>
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
          <FieldGroup label="Activities section" error={errors.activitiesReadiness?.message}>
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
          <FieldGroup label="School list" error={errors.schoolListReadiness?.message}>
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
          <FieldGroup label="School list preference flags">
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-4">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" {...register("researchHeavyPreference")} className="size-4" />
                Research-heavy school preference
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" {...register("serviceHeavyPreference")} className="size-4" />
                Community/service-heavy school preference
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" {...register("stateSchoolPriority")} className="size-4" />
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
            Saving recalculates the readiness score and gap year estimate.
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
