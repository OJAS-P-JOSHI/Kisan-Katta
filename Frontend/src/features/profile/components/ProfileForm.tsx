import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { Dropdown } from '@/components/Dropdown';
import { MultiSelectChips } from '@/components/MultiSelectChips';
import {
  COMMON_CROPS,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  MAHARASHTRA_DISTRICTS,
  MAX_FAVOURITE_CROPS,
  SUPPORTED_LANGUAGES,
  TALUKAS_BY_DISTRICT,
  strings,
  type MaharashtraDistrict,
  type SupportedLanguage,
} from '@/constants';
import { radius, spacing } from '@/theme';

export type ProfileFormValues = {
  name: string;
  district: string;
  taluka: string;
  village: string;
  favoriteCrops: string[];
  language: SupportedLanguage;
};

export type ProfileFormInitialValues = Partial<ProfileFormValues>;

type FormErrors = Partial<Record<'name' | 'district' | 'taluka' | 'village' | 'crops', string>>;

export type ProfileFormProps = {
  initialValues?: ProfileFormInitialValues;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  serverError?: string | null;
  onSubmit: (values: ProfileFormValues) => void;
};

const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map((code) => LANGUAGE_LABELS[code]);

/**
 * Shared field set for Name / District / Taluka / Village / Favourite Crops /
 * Language, used by both `CompleteProfileScreen` and `EditProfileScreen` so
 * validation and layout live in exactly one place.
 */
export function ProfileForm({
  initialValues,
  submitting,
  submitLabel,
  submittingLabel,
  serverError,
  onSubmit,
}: ProfileFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [district, setDistrict] = useState<MaharashtraDistrict | null>(
    (initialValues?.district as MaharashtraDistrict) ?? null,
  );
  const [taluka, setTaluka] = useState<string | null>(initialValues?.taluka ?? null);
  const [village, setVillage] = useState(initialValues?.village ?? '');
  const [crops, setCrops] = useState<string[]>(initialValues?.favoriteCrops ?? []);
  const [language, setLanguage] = useState<SupportedLanguage>(initialValues?.language ?? DEFAULT_LANGUAGE);
  const [errors, setErrors] = useState<FormErrors>({});

  const talukaOptions = useMemo(() => (district ? TALUKAS_BY_DISTRICT[district] : []), [district]);

  const handleSelectDistrict = (value: string): void => {
    setDistrict(value as MaharashtraDistrict);
    setTaluka(null);
    setErrors((e) => ({ ...e, district: undefined, taluka: undefined }));
  };

  const handleSelectLanguage = (label: string): void => {
    const code = SUPPORTED_LANGUAGES.find((c) => LANGUAGE_LABELS[c] === label);
    if (code) setLanguage(code);
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = strings.completeProfile.nameRequired;
    if (!district) nextErrors.district = strings.completeProfile.districtRequired;
    if (!taluka) nextErrors.taluka = strings.completeProfile.talukaRequired;
    if (!village.trim()) nextErrors.village = strings.completeProfile.villageRequired;
    if (crops.length === 0) nextErrors.crops = strings.completeProfile.cropsRequired;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validate() || !district || !taluka) return;
    onSubmit({
      name: name.trim(),
      district,
      taluka,
      village: village.trim(),
      favoriteCrops: crops,
      language,
    });
  };

  return (
    <View>
      <TextInput
        mode="outlined"
        label={strings.completeProfile.nameLabel}
        placeholder={strings.completeProfile.namePlaceholder}
        value={name}
        onChangeText={(text) => {
          setName(text);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={!!errors.name}
        style={styles.field}
        editable={!submitting}
      />
      {!!errors.name && <HelperText type="error">{errors.name}</HelperText>}

      <View style={styles.field}>
        <Dropdown
          label={strings.completeProfile.districtLabel}
          value={district}
          options={MAHARASHTRA_DISTRICTS}
          onSelect={handleSelectDistrict}
          error={errors.district}
          disabled={submitting}
        />
      </View>

      <View style={styles.field}>
        <Dropdown
          label={strings.completeProfile.talukaLabel}
          value={taluka}
          options={talukaOptions}
          onSelect={(value) => {
            setTaluka(value);
            setErrors((e) => ({ ...e, taluka: undefined }));
          }}
          error={errors.taluka}
          disabled={submitting || !district}
        />
      </View>

      <TextInput
        mode="outlined"
        label={strings.completeProfile.villageLabel}
        placeholder={strings.completeProfile.villagePlaceholder}
        value={village}
        onChangeText={(text) => {
          setVillage(text);
          setErrors((e) => ({ ...e, village: undefined }));
        }}
        error={!!errors.village}
        style={styles.field}
        editable={!submitting}
      />
      {!!errors.village && <HelperText type="error">{errors.village}</HelperText>}

      <View style={styles.field}>
        <MultiSelectChips
          label={strings.completeProfile.cropsLabel}
          helperText={strings.completeProfile.cropsHelper}
          options={COMMON_CROPS}
          selected={crops}
          onChange={(next) => {
            setCrops(next);
            setErrors((e) => ({ ...e, crops: undefined }));
          }}
          max={MAX_FAVOURITE_CROPS}
          error={errors.crops}
        />
      </View>

      <View style={styles.field}>
        <Dropdown
          label={strings.completeProfile.languageLabel}
          value={LANGUAGE_LABELS[language]}
          options={LANGUAGE_OPTIONS}
          onSelect={handleSelectLanguage}
          disabled={submitting}
        />
      </View>

      {!!serverError && (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      )}

      <Button
        mode="contained"
        style={styles.button}
        contentStyle={styles.buttonContent}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      >
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.sm },
  button: { marginTop: spacing.md, borderRadius: radius.md },
  buttonContent: { paddingVertical: spacing.xs },
});
