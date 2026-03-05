import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { servicesApi } from "@/lib/api";
import { Search, Plus, Phone, Mail, MessageCircle, Briefcase, ArrowLeft } from "lucide-react";

const CATEGORIES = [
  "All",
  "Legal",
  "Finance",
  "Medical",
  "Tech",
  "Construction",
  "Agriculture",
  "Education",
  "Consulting",
  "Other",
];

const Marketplace = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", search, selectedCategory],
    queryFn: () =>
      servicesApi.getAll({
        search: search || undefined,
        category: selectedCategory === "All" ? undefined : selectedCategory,
      }),
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Legal: "bg-blue-100 text-blue-800",
      Finance: "bg-green-100 text-green-800",
      Medical: "bg-red-100 text-red-800",
      Tech: "bg-purple-100 text-purple-800",
      Construction: "bg-orange-100 text-orange-800",
      Agriculture: "bg-lime-100 text-lime-800",
      Education: "bg-yellow-100 text-yellow-800",
      Consulting: "bg-indigo-100 text-indigo-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <AppLayout title="Marketplace">
      <div className="p-4 md:p-6 bg-[#f5f0e8] pb-24 md:pb-6">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">Marketplace</h2>
              <p className="text-muted-foreground">Support fellow Old Boys' businesses</p>
            </div>
            <Link to="/marketplace/new">
              <Button className="bg-black hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" /> List Your Service
              </Button>
            </Link>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white border-0 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-black" : "bg-white border-0 shadow-sm"}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <Card className="border-0 shadow-sm bg-white p-8">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No services found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {services.map((service: any) => (
                <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <Badge className={getCategoryColor(service.category)}>
                        {service.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">by {service.ownerName}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-amber-600">{service.price}</span>
                    </div>
                    <div className="flex gap-2">
                      {service.contact?.phone && (
                        <a href={`tel:${service.contact.phone}`}>
                          <Button size="sm" variant="outline">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      {service.contact?.email && (
                        <a href={`mailto:${service.contact.email}`}>
                          <Button size="sm" variant="outline">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      {service.contact?.whatsapp && (
                        <a
                          href={`https://wa.me/27${service.contact.whatsapp.slice(1)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1f2c]">Marketplace</h1>
              <p className="text-sm text-[#6b7280] mt-1">Support fellow Old Boys</p>
            </div>
            <Link to="/marketplace/new">
              <Button size="sm" className="bg-black hover:bg-gray-800">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-0 shadow-sm rounded-xl"
            />
          </div>

          {/* Category Pills - Scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-black text-white"
                    : "bg-white text-[#6b7280] shadow-sm"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Services List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <p className="text-[#6b7280]">Loading services...</p>
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-white rounded-2xl shadow-md p-8">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1a1f2c]">No services found</h3>
                <p className="text-[#6b7280] text-sm">Try adjusting your search</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service: any) => (
                <div key={service.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#1a1f2c] truncate">{service.title}</h3>
                        <p className="text-xs text-[#6b7280]">by {service.ownerName}</p>
                      </div>
                      <Badge className={`${getCategoryColor(service.category)} text-xs ml-2`}>
                        {service.category}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#6b7280] line-clamp-2 mb-3">
                      {service.description}
                    </p>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-600">{service.price}</span>
                      <div className="flex gap-2">
                        {service.contact?.phone && (
                          <a href={`tel:${service.contact.phone}`}>
                            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                              <Phone className="w-4 h-4 text-[#6b7280]" />
                            </button>
                          </a>
                        )}
                        {service.contact?.whatsapp && (
                          <a
                            href={`https://wa.me/27${service.contact.whatsapp.slice(1)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <button className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                              <MessageCircle className="w-4 h-4 text-green-600" />
                            </button>
                          </a>
                        )}
                        {service.contact?.email && (
                          <a href={`mailto:${service.contact.email}`}>
                            <button className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                              <Mail className="w-4 h-4 text-blue-600" />
                            </button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Marketplace;
