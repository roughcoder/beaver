import { api, type Id } from "@/convex";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  Bot,
  Settings,
  Bell,
  Plus,
  LogOut,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/_app/project/$projectId")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const id = projectId as Id<"projects">;
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuthActions();

  const project = useQuery(api.projects.get, { projectId: id });
  const projects = useQuery(api.projects.listMine, {});

  // Check if we're on the exact dashboard route (index route)
  const isExactDashboard = location.pathname === `/project/${id}` || location.pathname === `/project/${id}/`;

  const navItems = [
    { label: "Dashboard", to: "/project/$projectId", icon: LayoutDashboard, exact: true },
    { label: "Keywords", to: "/project/$projectId/keywords", icon: KeyRound },
    { label: "Content", to: "/project/$projectId/content", icon: FileText },
    { label: "Assistant", to: "/project/$projectId/assistant", icon: Bot },
    { label: "Settings", to: "/project/$projectId/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (project === undefined) {
    return <div className="text-muted-foreground">Loading project…</div>;
  }

  if (project === null) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Project not found</h1>
          <p className="text-muted-foreground">
            This project doesn't exist or you don't have access.
          </p>
        </div>
        <Button asChild>
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b bg-background">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3">
          {/* Left: Project Switcher */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <span className="font-medium">{project.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch project</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projects === undefined ? (
                  <DropdownMenuItem disabled>Loading projects…</DropdownMenuItem>
                ) : projects.length === 0 ? (
                  <DropdownMenuItem disabled>No projects</DropdownMenuItem>
                ) : (
                  projects.map((p) => (
                    <DropdownMenuItem key={p._id} asChild>
                      <Link
                        to="/project/$projectId"
                        params={{ projectId: p._id as Id<"projects"> }}
                        className="cursor-pointer"
                      >
                        {p.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/projects/new"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    New project
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center: Icon Navigation */}
          <div className="flex items-center justify-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // For Dashboard, only show active state on exact route match
              const isActive = item.exact 
                ? isExactDashboard
                : undefined; // Let TanStack Router handle active state for other routes
              
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  params={{ projectId: id }}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
                    item.exact && isActive ? "bg-muted text-foreground" : ""
                  }`}
                  activeProps={
                    item.exact
                      ? undefined // Don't use activeProps for exact match routes
                      : {
                          className:
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-muted text-foreground",
                        }
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Notifications & User Menu */}
          <div className="flex items-center justify-end gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {project.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}    
      <section className="flex-1 mx-auto w-full max-w-5xl p-4">
        <Outlet />
      </section>
    </div>
  );
}


