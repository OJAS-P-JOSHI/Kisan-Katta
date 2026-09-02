import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, TextInput } from 'react-native-paper';

import { Dropdown } from '@/components/Dropdown';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { radius, spacing } from '@/theme';

import { CropSelector } from './CropSelector';
import { FormSection } from './FormSection';
import { HarvestDateField } from './HarvestDateField';
import { ListingImagePicker } from './ListingImagePicker';
import {
  LABOUR_CATEGORIES,
  LABOUR_GENDER_FORM_OPTIONS,
  LABOUR_GENDERS,
  LABOUR_RATE_FORM_OPTION,
  MARKETPLACE_UNITS,
  MAX_LABOUR_LISTING_IMAGES,
  MAX_LISTING_IMAGES,
  PRODUCT_CATEGORIES,
} from '../marketplace.constants';
import type { UseListingImagesReturn } from '../hooks/useListingImages';
import {
  getCategoryLabel,
  getGenderLabel,
  marketplaceStrings,
} from '../marketplace.strings';
import { listingTypeAccent, mp } from '../marketplace.ui';
import type {
  CreateListingPayload,
  LabourGender,
  LabourRateType,
  ListingType,
  MarketplaceCategory,
  MarketplaceListing,
  MarketplaceUnit,
  UpdateListingPayload,
} from '../marketplace.types';
import { buildLabourTitle, getLabourGroupLabel } from '../marketplace.utils';

export type ListingFormValues = {
  listingType: ListingType;
  crop: string;
  quantity: string;
  unit: MarketplaceUnit | null;
  expectedPrice: string;
  harvestDate: string;
  productName: string;
  brand: string;
  category: MarketplaceCategory | null;
  stock: string;
  price: string;
  description: string;
  availableWorkers: string;
  gender: LabourGender | null;
  rateType: LabourRateType | null;
  availableFrom: string;
};

export type ListingCreateSubmitPayload = Omit<CreateListingPayload, 'images'>;
export type ListingUpdateSubmitPayload = Omit<UpdateListingPayload, 'images'>;
export type ListingFormSubmitPayload = ListingCreateSubmitPayload | ListingUpdateSubmitPayload;

type ListingFormProps = {
  initialListing?: MarketplaceListing;
  /** Create-form prefill only. Does not switch the form into edit mode. */
  prefillFrom?: MarketplaceListing;
  images: UseListingImagesReturn;
  onUploadRetry?: () => void;
  submitting: boolean;
  serverError?: string | null;
  onSubmit: (payload: ListingFormSubmitPayload) => void | Promise<void>;
  submitLabel: string;
  submittingLabel: string;
};

const emptyValues = (listingType: ListingType = 'produce'): ListingFormValues => ({
  listingType,
  crop: '',
  quantity: '',
  unit: null,
  expectedPrice: '',
  harvestDate: '',
  productName: '',
  brand: '',
  category: listingType === 'produce' ? 'Produce' : null,
  stock: '',
  price: '',
  description: '',
  availableWorkers: '',
  gender: null,
  rateType: listingType === 'labour' ? LABOUR_RATE_FORM_OPTION : null,
  availableFrom: '',
});

const valuesFromListing = (listing: MarketplaceListing): ListingFormValues => ({
  listingType: listing.listingType,
  crop: listing.crop ?? '',
  quantity: listing.quantity != null ? String(listing.quantity) : '',
  unit: listing.unit ?? null,
  expectedPrice:
    listing.expectedPrice != null
      ? String(listing.expectedPrice)
      : listing.price != null
        ? String(listing.price)
        : '',
  harvestDate: listing.harvestDate ? listing.harvestDate.slice(0, 10) : '',
  productName: listing.title,
  brand: listing.brand ?? '',
  category: listing.category,
  stock: listing.stock != null ? String(listing.stock) : '',
  price: String(listing.price),
  description: listing.description ?? '',
  availableWorkers: listing.availableWorkers != null ? String(listing.availableWorkers) : '',
  gender: listing.gender ?? null,
  rateType:
    listing.rateType ??
    (listing.listingType === 'labour' ? LABOUR_RATE_FORM_OPTION : null),
  availableFrom: listing.availableFrom ? listing.availableFrom.slice(0, 10) : '',
});

const valuesFromPrefill = (listing: MarketplaceListing): ListingFormValues => {
  const values = valuesFromListing(listing);
  if (values.listingType !== 'labour') return values;
  return {
    ...values,
    rateType: LABOUR_RATE_FORM_OPTION,
    gender: values.gender === 'Male' || values.gender === 'Female' ? values.gender : null,
  };
};

const parseNumber = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const parsePositiveInteger = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
};

const productCategoryOptions = PRODUCT_CATEGORIES.map((category) => getCategoryLabel(category));
const labourCategoryOptions = LABOUR_CATEGORIES.map((category) => getCategoryLabel(category));
const genderOptions = LABOUR_GENDER_FORM_OPTIONS.map((gender) => getGenderLabel(gender));

const toProductCategoryValue = (label: string): MarketplaceCategory | null => {
  const match = PRODUCT_CATEGORIES.find((category) => getCategoryLabel(category) === label);
  return match ?? null;
};

const toLabourCategoryValue = (label: string): MarketplaceCategory | null => {
  const match = LABOUR_CATEGORIES.find((category) => getCategoryLabel(category) === label);
  return match ?? null;
};

const toGenderValue = (label: string): LabourGender | null => {
  const match = LABOUR_GENDERS.find((gender) => getGenderLabel(gender) === label);
  return match ?? null;
};

export function ListingForm({
  initialListing,
  prefillFrom,
  images,
  onUploadRetry,
  submitting,
  serverError,
  onSubmit,
  submitLabel,
  submittingLabel,
}: ListingFormProps) {
  const { data: profile } = useMyProfile();
  const isEdit = !!initialListing;
  const [values, setValues] = useState<ListingFormValues>(() => {
    if (initialListing) return valuesFromListing(initialListing);
    if (prefillFrom) return valuesFromPrefill(prefillFrom);
    return emptyValues();
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormValues | 'images', string>>>(
    {},
  );
  const submitLockRef = useRef(false);

  const imageMax =
    values.listingType === 'labour' ? MAX_LABOUR_LISTING_IMAGES : MAX_LISTING_IMAGES;
  const typeAccent = listingTypeAccent[values.listingType];

  const locationLabel = useMemo(() => {
    if (values.listingType === 'labour') {
      if (profile?.village && profile?.taluka && profile?.district) {
        return marketplaceStrings.create.locationAuto(
          profile.village,
          profile.taluka,
          profile.district,
        );
      }
      return marketplaceStrings.create.districtLoading;
    }
    return profile?.district
      ? marketplaceStrings.create.districtAuto(profile.district)
      : marketplaceStrings.create.districtLoading;
  }, [profile, values.listingType]);

  const labourTitlePreview = useMemo(() => {
    if (values.listingType !== 'labour' || !values.category) return null;
    const workers = parsePositiveInteger(values.availableWorkers) ?? 1;
    return buildLabourTitle(values.category, workers);
  }, [values.availableWorkers, values.category, values.listingType]);

  const isBusy = submitting || images.isUploading;

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof ListingFormValues | 'images', string>> = {};

    if (values.listingType === 'produce') {
      if (!values.crop.trim()) nextErrors.crop = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.quantity)) nextErrors.quantity = marketplaceStrings.errors.invalidQuantity;
      if (!values.unit) nextErrors.unit = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.expectedPrice)) {
        nextErrors.expectedPrice = marketplaceStrings.errors.invalidPrice;
      }
      if (!values.harvestDate.trim()) nextErrors.harvestDate = marketplaceStrings.errors.requiredField;
    } else if (values.listingType === 'labour') {
      if (!values.category) nextErrors.category = marketplaceStrings.errors.requiredField;
      if (!parsePositiveInteger(values.availableWorkers)) {
        nextErrors.availableWorkers = marketplaceStrings.errors.invalidWorkers;
      }
      if (!values.gender) nextErrors.gender = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.price)) nextErrors.price = marketplaceStrings.errors.invalidPrice;
      if (!values.availableFrom.trim()) {
        nextErrors.availableFrom = marketplaceStrings.errors.requiredField;
      }
      if (!values.description.trim()) nextErrors.description = marketplaceStrings.errors.requiredField;
      if (images.previewUris.length === 0) {
        nextErrors.images = marketplaceStrings.errors.imagesRequired;
      } else if (images.previewUris.length > MAX_LABOUR_LISTING_IMAGES) {
        nextErrors.images = marketplaceStrings.images.maxReachedLabour;
      }
    } else {
      if (!values.productName.trim()) nextErrors.productName = marketplaceStrings.errors.requiredField;
      if (!values.category) nextErrors.category = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.price)) nextErrors.price = marketplaceStrings.errors.invalidPrice;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (isBusy || submitLockRef.current) return;
    if (!validate()) return;

    const submitPayload = (): ListingFormSubmitPayload | null => {
      if (values.listingType === 'produce') {
        const price = parseNumber(values.expectedPrice)!;
        const producePayload = {
          title: values.crop.trim(),
          category: 'Produce' as const,
          price,
          expectedPrice: price,
          crop: values.crop.trim(),
          quantity: parseNumber(values.quantity)!,
          unit: values.unit!,
          harvestDate: values.harvestDate.trim(),
          description: values.description.trim() || undefined,
        };
        return isEdit ? producePayload : { listingType: 'produce' as const, ...producePayload };
      }

      if (values.listingType === 'labour') {
        const workers = parsePositiveInteger(values.availableWorkers)!;
        const labourPayload = {
          title: buildLabourTitle(values.category!, workers),
          category: values.category!,
          price: parseNumber(values.price)!,
          availableWorkers: workers,
          gender: values.gender!,
          rateType: values.rateType ?? LABOUR_RATE_FORM_OPTION,
          availableFrom: values.availableFrom.trim(),
          description: values.description.trim(),
        };
        return isEdit ? labourPayload : { listingType: 'labour' as const, ...labourPayload };
      }

      const productPayload = {
        title: values.productName.trim(),
        category: values.category!,
        price: parseNumber(values.price)!,
        brand: values.brand.trim() || undefined,
        stock: parseNumber(values.stock) ?? undefined,
        description: values.description.trim() || undefined,
      };
      return isEdit ? productPayload : { listingType: 'product' as const, ...productPayload };
    };

    const payload = submitPayload();
    if (!payload) return;

    submitLockRef.current = true;
    void Promise.resolve(onSubmit(payload)).finally(() => {
      submitLockRef.current = false;
    });
  };

  const handleListingTypeChange = (nextType: string) => {
    if (isEdit) return;
    const listingType = nextType as ListingType;
    setValues(emptyValues(listingType));
    setErrors({});
    images.clearImages();
    images.setMaxImages(
      listingType === 'labour' ? MAX_LABOUR_LISTING_IMAGES : MAX_LISTING_IMAGES,
    );
  };

  const workersCount = parsePositiveInteger(values.availableWorkers);

  const fieldProps = {
    outlineColor: mp.searchBorder,
    activeOutlineColor: mp.primaryGreen,
    style: styles.field,
  } as const;

  return (
    <View style={styles.form}>
      <FormSection
        icon="camera-outline"
        title={marketplaceStrings.create.sections.photos}
        hint={marketplaceStrings.create.photosCount(images.previewUris.length, imageMax)}
        accent={typeAccent}
      >
        <ListingImagePicker
          images={images}
          disabled={isBusy}
          onRetry={onUploadRetry}
          maxImages={imageMax}
        />
        {prefillFrom ? (
          <HelperText type="info">{marketplaceStrings.create.duplicateImagesHint}</HelperText>
        ) : null}
        {errors.images ? <HelperText type="error">{errors.images}</HelperText> : null}
      </FormSection>

      {!isEdit ? (
        <FormSection
          icon="shape-outline"
          title={marketplaceStrings.create.sections.listingType}
          accent={typeAccent}
        >
          <SegmentedButtons
            value={values.listingType}
            onValueChange={handleListingTypeChange}
            buttons={[
              { value: 'produce', label: marketplaceStrings.create.produce },
              { value: 'product', label: marketplaceStrings.create.product },
              { value: 'labour', label: marketplaceStrings.create.labour },
            ]}
            style={styles.segmented}
          />
          <RNText style={styles.classifiedNote} maxFontSizeMultiplier={1.5}>
            {marketplaceStrings.create.classifiedNote}
          </RNText>
        </FormSection>
      ) : null}

      <FormSection icon="map-marker-outline" title={marketplaceStrings.create.sections.location}>
        <RNText style={styles.locationText} maxFontSizeMultiplier={1.5}>
          {locationLabel}
        </RNText>
      </FormSection>

      {values.listingType === 'produce' ? (
        <>
          <FormSection
            icon="barley"
            title={marketplaceStrings.create.sections.produceDetails}
            accent={typeAccent}
          >
            <CropSelector
              value={values.crop}
              onSelect={(crop) => setValues((v) => ({ ...v, crop }))}
              error={errors.crop}
            />
          </FormSection>

          <FormSection
            icon="scale-balance"
            title={marketplaceStrings.create.sections.quantityPrice}
            accent={typeAccent}
          >
            <View style={styles.quantityRow}>
              <View style={styles.quantityInput}>
                <TextInput
                  mode="outlined"
                  label={marketplaceStrings.create.quantity}
                  value={values.quantity}
                  onChangeText={(quantity) => setValues((v) => ({ ...v, quantity }))}
                  keyboardType="numeric"
                  error={!!errors.quantity}
                  {...fieldProps}
                />
              </View>
              <View style={styles.unitInput}>
                <Dropdown
                  label={marketplaceStrings.create.unit}
                  value={values.unit}
                  options={MARKETPLACE_UNITS}
                  onSelect={(unit) => setValues((v) => ({ ...v, unit: unit as MarketplaceUnit }))}
                  error={errors.unit}
                />
              </View>
            </View>
            {errors.quantity ? <HelperText type="error">{errors.quantity}</HelperText> : null}

            <TextInput
              mode="outlined"
              label={marketplaceStrings.create.expectedPrice}
              value={values.expectedPrice}
              onChangeText={(expectedPrice) => setValues((v) => ({ ...v, expectedPrice }))}
              keyboardType="numeric"
              error={!!errors.expectedPrice}
              left={<TextInput.Affix text="₹" />}
              {...fieldProps}
            />
            {errors.expectedPrice ? (
              <HelperText type="error">{errors.expectedPrice}</HelperText>
            ) : null}
          </FormSection>

          <FormSection
            icon="calendar-outline"
            title={marketplaceStrings.create.sections.availability}
            accent={typeAccent}
          >
            <HarvestDateField
              value={values.harvestDate}
              onChange={(harvestDate) => setValues((v) => ({ ...v, harvestDate }))}
              error={errors.harvestDate}
            />
          </FormSection>
        </>
      ) : null}

      {values.listingType === 'labour' ? (
        <>
          <FormSection
            icon="account-hard-hat"
            title={marketplaceStrings.create.sections.labourDetails}
            accent={typeAccent}
          >
            <Dropdown
              label={marketplaceStrings.create.labourCategory}
              value={values.category ? getCategoryLabel(values.category) : null}
              options={labourCategoryOptions}
              onSelect={(label) => {
                setValues((v) => ({ ...v, category: toLabourCategoryValue(label) }));
              }}
              error={errors.category}
            />

            {labourTitlePreview ? (
              <RNText style={styles.previewText} maxFontSizeMultiplier={1.5}>
                {marketplaceStrings.create.titlePreview}: {labourTitlePreview}
              </RNText>
            ) : null}

            <TextInput
              mode="outlined"
              label={marketplaceStrings.create.availableWorkers}
              value={values.availableWorkers}
              onChangeText={(availableWorkers) => setValues((v) => ({ ...v, availableWorkers }))}
              keyboardType="number-pad"
              error={!!errors.availableWorkers}
              {...fieldProps}
            />
            {errors.availableWorkers ? (
              <HelperText type="error">{errors.availableWorkers}</HelperText>
            ) : null}
            {workersCount != null ? (
              <RNText style={styles.previewText} maxFontSizeMultiplier={1.5}>
                {getLabourGroupLabel(workersCount) === 'Individual'
                  ? marketplaceStrings.detail.individual
                  : marketplaceStrings.detail.group}
              </RNText>
            ) : null}

            <Dropdown
              label={marketplaceStrings.create.gender}
              value={values.gender ? getGenderLabel(values.gender) : null}
              options={genderOptions}
              onSelect={(label) => setValues((v) => ({ ...v, gender: toGenderValue(label) }))}
              error={errors.gender}
            />
          </FormSection>

          <FormSection icon="currency-inr" title={marketplaceStrings.create.sections.rate} accent={typeAccent}>
            <TextInput
              mode="outlined"
              label={
                values.rateType === 'per_hour'
                  ? marketplaceStrings.create.rate
                  : marketplaceStrings.create.dailyRate
              }
              value={values.price}
              onChangeText={(price) => setValues((v) => ({ ...v, price }))}
              keyboardType="numeric"
              error={!!errors.price}
              left={<TextInput.Affix text="₹" />}
              {...fieldProps}
            />
            {errors.price ? <HelperText type="error">{errors.price}</HelperText> : null}
          </FormSection>

          <FormSection
            icon="calendar-outline"
            title={marketplaceStrings.create.sections.availability}
            accent={typeAccent}
          >
            <HarvestDateField
              value={values.availableFrom}
              onChange={(availableFrom) => setValues((v) => ({ ...v, availableFrom }))}
              error={errors.availableFrom}
              label={marketplaceStrings.create.availableFrom}
              placeholder={marketplaceStrings.create.availableFromPlaceholder}
            />
          </FormSection>
        </>
      ) : null}

      {values.listingType === 'product' ? (
        <>
          <FormSection
            icon="sack"
            title={marketplaceStrings.create.sections.productDetails}
            accent={typeAccent}
          >
            <TextInput
              mode="outlined"
              label={marketplaceStrings.create.productName}
              placeholder={marketplaceStrings.create.productNamePlaceholder}
              value={values.productName}
              onChangeText={(productName) => setValues((v) => ({ ...v, productName }))}
              error={!!errors.productName}
              {...fieldProps}
            />
            {errors.productName ? <HelperText type="error">{errors.productName}</HelperText> : null}

            <TextInput
              mode="outlined"
              label={marketplaceStrings.create.brand}
              placeholder={marketplaceStrings.create.brandPlaceholder}
              value={values.brand}
              onChangeText={(brand) => setValues((v) => ({ ...v, brand }))}
              {...fieldProps}
            />

            <Dropdown
              label={marketplaceStrings.create.category}
              value={values.category ? getCategoryLabel(values.category) : null}
              options={productCategoryOptions}
              onSelect={(label) => {
                setValues((v) => ({ ...v, category: toProductCategoryValue(label) }));
              }}
              error={errors.category}
            />
          </FormSection>

          <FormSection
            icon="tag-outline"
            title={marketplaceStrings.create.sections.quantityPrice}
            accent={typeAccent}
          >
            <TextInput
              mode="outlined"
              label={marketplaceStrings.create.stock}
              value={values.stock}
              onChangeText={(stock) => setValues((v) => ({ ...v, stock }))}
              keyboardType="numeric"
              {...fieldProps}
            />

            <TextInput
              mode="outlined"
              label={marketplaceStrings.create.price}
              value={values.price}
              onChangeText={(price) => setValues((v) => ({ ...v, price }))}
              keyboardType="numeric"
              error={!!errors.price}
              left={<TextInput.Affix text="₹" />}
              {...fieldProps}
            />
            {errors.price ? <HelperText type="error">{errors.price}</HelperText> : null}
          </FormSection>
        </>
      ) : null}

      <FormSection icon="text-box-outline" title={marketplaceStrings.create.sections.description}>
        <TextInput
          mode="outlined"
          label={marketplaceStrings.create.description}
          placeholder={
            values.listingType === 'labour'
              ? marketplaceStrings.create.labourDescriptionPlaceholder
              : marketplaceStrings.create.descriptionPlaceholder
          }
          value={values.description}
          onChangeText={(description) => setValues((v) => ({ ...v, description }))}
          multiline
          numberOfLines={4}
          error={!!errors.description}
          {...fieldProps}
          style={[styles.field, styles.description]}
        />
        {errors.description ? <HelperText type="error">{errors.description}</HelperText> : null}
      </FormSection>

      {serverError ? <HelperText type="error">{serverError}</HelperText> : null}

      <View style={styles.publishWrap}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isBusy}
          disabled={isBusy}
          buttonColor={mp.primaryGreen}
          textColor={mp.white}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          labelStyle={styles.submitLabel}
        >
          {isBusy ? submittingLabel : submitLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  scrollContent: { padding: spacing.md, gap: 16, paddingBottom: 40 },
  segmented: { marginBottom: 0 },
  quantityRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', minWidth: 0 },
  quantityInput: { flex: 1, minWidth: 0 },
  unitInput: { flex: 1, minWidth: 0 },
  field: { backgroundColor: mp.white },
  description: { minHeight: 96 },
  classifiedNote: {
    color: mp.bodyGrey,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
  },
  locationText: {
    color: mp.tagline,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  previewText: {
    color: mp.bodyGrey,
    fontSize: 13,
    lineHeight: 18,
  },
  publishWrap: {
    marginTop: 4,
    paddingTop: 4,
  },
  submitButton: { borderRadius: radius.lg },
  submitButtonContent: { paddingVertical: spacing.sm, minHeight: 52 },
  submitLabel: { fontWeight: '700', letterSpacing: 0.2, fontSize: 16 },
});

export const listingFormScrollProps = {
  contentContainerStyle: styles.scrollContent,
  keyboardShouldPersistTaps: 'handled' as const,
};
