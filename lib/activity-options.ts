import type { ComponentType } from "react";
import {
  HikingBootIcon,
  PalmTreeIcon,
  MuseumIcon,
  MoonIcon,
  ForkKnifeIcon,
  ShoppingBagIcon,
  LeafIcon,
  MountainIcon,
  CameraIcon,
  PineTreeIcon,
} from "@/app/icons";

export const ACTIVITY_INTEREST_OPTIONS = [
  "hiking",
  "beach",
  "museums",
  "nightlife",
  "food & dining",
  "shopping",
  "relaxation & spa",
  "adventure sports",
  "sightseeing",
  "nature",
] as const;

export const ACTIVITY_INTEREST_ICON: Record<
  (typeof ACTIVITY_INTEREST_OPTIONS)[number],
  ComponentType<{ size?: number; className?: string }>
> = {
  hiking: HikingBootIcon,
  beach: PalmTreeIcon,
  museums: MuseumIcon,
  nightlife: MoonIcon,
  "food & dining": ForkKnifeIcon,
  shopping: ShoppingBagIcon,
  "relaxation & spa": LeafIcon,
  "adventure sports": MountainIcon,
  sightseeing: CameraIcon,
  nature: PineTreeIcon,
};
