import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { Dropdown } from '@/components/Dropdown';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { radius, spacing, useAppTheme } from '@/theme';

import { CropSelector } from './CropSelector';
import { HarvestDateField } from './HarvestDateField';
import { ListingImagePicker } from './ListingImagePicker';
import {
  MARKETPLACE_UNITS,
  PRODUCT_CATEGORIES,
} from '../marketplace.constants';
import type { UseListingImagesReturn } from '../hooks/useListingImages';
import { getCategoryLabel, marketplaceStrings } from '../marketplace.strings';
import type {
  CreateListingPayload,
  ListingType,
  MarketplaceCategory,
  MarketplaceListing,
  MarketplaceUnit,
  UpdateListingPayload,
} from '../marketplace.types';

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
};

export type ListingCreateSubmitPayload = Omit<CreateListingPayload, 'images'>;
export type ListingUpdateSubmitPayload = Omit<UpdateListingPayload, 'images'>;
export type ListingFormSubmitPayload = ListingCreateSubmitPayload | ListingUpdateSubmitPayload;

type ListingFormProps = {
  initialListing?: MarketplaceListing;
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
  category: null,
  stock: '',
  price: '',
  description: '',
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
});

const parseNumber = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const productCategoryOptions = PRODUCT_CATEGORIES.map((category) => getCategoryLabel(category));

const toProductCategoryValue = (label: string): MarketplaceCategory | null => {
  const match = PRODUCT_CATEGORIES.find((category) => getCategoryLabel(category) === label);
  return match ?? null;
};

export function ListingForm({
  initialListing,
  images,
  onUploadRetry,
  submitting,
  serverError,
  onSubmit,
  submitLabel,
  submittingLabel,
}: ListingFormProps) {
  const theme = useAppTheme();
  const { data: profile } = useMyProfile();
  const isEdit = !!initialListing;
  const [values, setValues] = useState<ListingFormValues>(() =>
    initialListing ? valuesFromListing(initialListing) : emptyValues(),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ListingFormValues, string>>>({});

  const categoryOptions = useMemo(
    () => (values.listingType === 'produce' ? ['Produce'] : productCategoryOptions),
    [values.listingType],
  );

  const districtLabel = profile?.district
    ? marketplaceStrings.create.districtAuto(profile.district)
    : marketplaceStrings.create.districtLoading;

  const isBusy = submitting || images.isUploading;

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof ListingFormValues, string>> = {};

    if (values.listingType === 'produce') {
      if (!values.crop.trim()) nextErrors.crop = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.quantity)) nextErrors.quantity = marketplaceStrings.errors.invalidQuantity;
      if (!values.unit) nextErrors.unit = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.expectedPrice)) nextErrors.expectedPrice = marketplaceStrings.errors.invalidPrice;
      if (!values.harvestDate.trim()) nextErrors.harvestDate = marketplaceStrings.errors.requiredField;
    } else {
      if (!values.productName.trim()) nextErrors.productName = marketplaceStrings.errors.requiredField;
      if (!values.category) nextErrors.category = marketplaceStrings.errors.requiredField;
      if (!parseNumber(values.price)) nextErrors.price = marketplaceStrings.errors.invalidPrice;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

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

      if (isEdit) {
        onSubmit(producePayload);
        return;
      }

      onSubmit({ listingType: 'produce' as const, ...producePayload });
      return;
    }

    const productPayload = {
      title: values.productName.trim(),
      category: values.category!,
      price: parseNumber(values.price)!,
      brand: values.brand.trim() || undefined,
      stock: parseNumber(values.stock) ?? undefined,
      description: values.description.trim() || undefined,
    };

    if (isEdit) {
      onSubmit(productPayload);
      return;
    }

    onSubmit({ listingType: 'product' as const, ...productPayload });
  };

  const handleListingTypeChange = (nextType: string) => {
    if (isEdit) return;
    const listingType = nextType as ListingType;
    setValues(emptyValues(listingType));
    setErrors({});
  };

  return (
    <View style={styles.form}>
      <ListingImagePicker images={images} disabled={isBusy} onRetry={onUploadRetry} />

      {!isEdit ? (
        <SegmentedButtons
          value={values.listingType}
          onValueChange={handleListingTypeChange}
          buttons={[
            { value: 'produce', label: marketplaceStrings.create.produce },
            { value: 'product', label: marketplaceStrings.create.product },
          ]}
          style={styles.segmented}
        />
      ) : null}

      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {districtLabel}
      </Text>

      {values.listingType === 'produce' ? (
        <>
          <CropSelector
            value={values.crop}
            onSelect={(crop) => setValues((v) => ({ ...v, crop }))}
            error={errors.crop}
          />

          <View style={styles.quantityRow}>
            <View style={styles.quantityInput}>
              <TextInput
                mode="outlined"
                label={marketplaceStrings.create.quantity}
                value={values.quantity}
                onChangeText={(quantity) => setValues((v) => ({ ...v, quantity }))}
                keyboardType="numeric"
                error={!!errors.quantity}
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
          />
          {errors.expectedPrice ? <HelperText type="error">{errors.expectedPrice}</HelperText> : null}

          <HarvestDateField
            value={values.harvestDate}
            onChange={(harvestDate) => setValues((v) => ({ ...v, harvestDate }))}
            error={errors.harvestDate}
          />
        </>
      ) : (
        <>
          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.productName}
            placeholder={marketplaceStrings.create.productNamePlaceholder}
            value={values.productName}
            onChangeText={(productName) => setValues((v) => ({ ...v, productName }))}
            error={!!errors.productName}
          />
          {errors.productName ? <HelperText type="error">{errors.productName}</HelperText> : null}

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.brand}
            placeholder={marketplaceStrings.create.brandPlaceholder}
            value={values.brand}
            onChangeText={(brand) => setValues((v) => ({ ...v, brand }))}
          />

          <Dropdown
            label={marketplaceStrings.create.category}
            value={values.category ? getCategoryLabel(values.category) : null}
            options={categoryOptions}
            onSelect={(label) => {
              const category =
                values.listingType === 'produce'
                  ? ('Produce' as MarketplaceCategory)
                  : toProductCategoryValue(label);
              setValues((v) => ({ ...v, category }));
            }}
            error={errors.category}
          />

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.stock}
            value={values.stock}
            onChangeText={(stock) => setValues((v) => ({ ...v, stock }))}
            keyboardType="numeric"
          />

          <TextInput
            mode="outlined"
            label={marketplaceStrings.create.price}
            value={values.price}
            onChangeText={(price) => setValues((v) => ({ ...v, price }))}
            keyboardType="numeric"
            error={!!errors.price}
            left={<TextInput.Affix text="₹" />}
          />
          {errors.price ? <HelperText type="error">{errors.price}</HelperText> : null}
        </>
      )}

      <TextInput
        mode="outlined"
        label={marketplaceStrings.create.description}
        placeholder={marketplaceStrings.create.descriptionPlaceholder}
        value={values.description}
        onChangeText={(description) => setValues((v) => ({ ...v, description }))}
        multiline
        numberOfLines={4}
      />

      {serverError ? <HelperText type="error">{serverError}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isBusy}
        disabled={isBusy}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        {isBusy ? submittingLabel : submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  scrollContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  segmented: { marginBottom: spacing.sm },
  quantityRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  quantityInput: { flex: 1 },
  unitInput: { flex: 1 },
  submitButton: { marginTop: spacing.md, borderRadius: radius.md },
  submitButtonContent: { paddingVertical: spacing.sm, minHeight: 48 },
});

export const listingFormScrollProps = {
  contentContainerStyle: styles.scrollContent,
  keyboardShouldPersistTaps: 'handled' as const,
};
