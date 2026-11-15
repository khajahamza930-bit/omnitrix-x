import { lazy } from "react";

// Load only the selected alien model instead of importing all models
// into the initial 3D watch bundle.
const alienModels = {
  1: lazy(() => import("./Heatblast")),
  2: lazy(() => import("./FourArms")),
  3: lazy(() => import("./XLR8")),
  4: lazy(() => import("./Diamondhead")),
  5: lazy(() => import("./Upgrade")),
  6: lazy(() => import("./Cannonbolt")),
  7: lazy(() => import("./Wildmutt")),
  8: lazy(() => import("./Ripjaws")),
  9: lazy(() => import("./GreyMatter")),
  10: lazy(() => import("./Stinkfly")),
  11: lazy(() => import("./Ghostfreak")),
};

export default alienModels;