import Heatblast from "./Heatblast";
import FourArms from "./FourArms";
import XLR8 from "./XLR8";
import Diamondhead from "./Diamondhead";
import Upgrade from "./Upgrade";
import Cannonbolt from "./Cannonbolt";
import Wildmutt from "./Wildmutt";
import Ripjaws from "./Ripjaws";
import GreyMatter from "./GreyMatter";

// This list connects an alien id (from aliens.js) to its 3D model.
// When we finish a new alien, we add one line here.
const alienModels = {
  1: Heatblast,
  2: FourArms,
  3: XLR8,
  4: Diamondhead,
  5: Upgrade,
  6: Cannonbolt,
  7: Wildmutt,
  8: Ripjaws,
  9: GreyMatter,
};

export default alienModels;
