import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/ui/Button";
import { Shell } from "@/components/Shell";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/Card";

const AnimePage = () => {
  return (
    <Shell layout="dashboard">
      <Header
        title="Anime"
        description="Animes that you have uploaded"
        size="sm"
      />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card className="flex h-full flex-col">
          <CardHeader className="flex-1">
            <CardTitle className="line-clamp-1">Add a new anime</CardTitle>
            <CardDescription className="line-clamp-2">
              Add a new anime which will be displayed to the users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/anime/new">
              <div
                className={cn(
                  buttonVariants({
                    size: "sm",
                    className: "h-8 w-full",
                  })
                )}
              >
                Add a new anime
                <span className="sr-only">Add a new anime</span>
              </div>
            </Link>
          </CardContent>
        </Card>
        {/* TODO: display anime's created by the admin-user */}
      </div>
    </Shell>
  );
};

export default AnimePage;