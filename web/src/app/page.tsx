import { heroPool, topPicks, installations, premiumBaths, topFaucets, bestDeals } from "@/lib/showcase";
import { HomeClient } from "./HomeClient";

// Серверная обёртка: showcase-выборки считаются при сборке и приходят в
// клиент готовыми пропсами — полный индекс каталога не попадает в JS-бандл.
export default function HomePage() {
  return (
    <HomeClient
      data={{ heroPool, topPicks, installations, premiumBaths, topFaucets, bestDeals }}
    />
  );
}
