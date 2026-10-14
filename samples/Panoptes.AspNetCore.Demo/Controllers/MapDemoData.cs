using System.Collections.Generic;

namespace Panoptes.AspNetCore.Demo.Controllers;

public static class MapDemoData
{
    public class CityLocation
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public double Lat { get; set; }
        public double Lng { get; set; }
        public long Population { get; set; }
        public double Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string Color { get; set; } = "#3b82f6";
        public string Category { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public double Rating { get; set; } = 4.8;
        public string ImageUrl { get; set; } = string.Empty;
        public string Tooltip { get; set; } = string.Empty;
    }

    public static List<CityLocation> GetCities()
    {
        return new List<CityLocation>
        {
            new CityLocation
            {
                Id = "ist",
                Title = "İstanbul",
                Lat = 41.0082,
                Lng = 28.9784,
                Population = 15655924,
                Value = 15655924,
                Unit = "Kişi",
                Color = "#6366f1",
                Category = "Metropol",
                Address = "Levent & Maslak Finans Merkezi, İstanbul",
                Phone = "+90 (212) 555-0100",
                Rating = 4.9,
                ImageUrl = "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=300&q=80",
                Tooltip = "Türkiye'nin ekonomi, finans ve kültür başkenti (15.6M Nüfus)"
            },
            new CityLocation
            {
                Id = "ank",
                Title = "Ankara",
                Lat = 39.9334,
                Lng = 32.8597,
                Population = 5803482,
                Value = 5803482,
                Unit = "Kişi",
                Color = "#ef4444",
                Category = "Başkent",
                Address = "Kızılay & Çankaya, Ankara",
                Phone = "+90 (312) 555-0200",
                Rating = 4.8,
                ImageUrl = "https://images.unsplash.com/photo-1589083115049-743e498c4f55?w=300&q=80",
                Tooltip = "Türkiye Cumhuriyeti'nin başkenti ve idari merkezi (5.8M Nüfus)"
            },
            new CityLocation
            {
                Id = "izm",
                Title = "İzmir",
                Lat = 38.4237,
                Lng = 27.1428,
                Population = 4462056,
                Value = 4462056,
                Unit = "Kişi",
                Color = "#06b6d4",
                Category = "Ege Merkezi",
                Address = "Alsancak & Konak, İzmir",
                Phone = "+90 (232) 555-0300",
                Rating = 4.9,
                ImageUrl = "https://images.unsplash.com/photo-1596726694602-0e9e4ffbe9d8?w=300&q=80",
                Tooltip = "Ege'nin incisi, ihracat ve liman kenti (4.4M Nüfus)"
            },
            new CityLocation
            {
                Id = "bur",
                Title = "Bursa",
                Lat = 40.1885,
                Lng = 29.0610,
                Population = 3194720,
                Value = 3194720,
                Unit = "Kişi",
                Color = "#10b981",
                Category = "Sanayi",
                Address = "Nilüfer OSB & Osmangazi, Bursa",
                Phone = "+90 (224) 555-0400",
                Rating = 4.7,
                ImageUrl = "https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=300&q=80",
                Tooltip = "Otomotiv ve tekstil sanayi merkezi (3.1M Nüfus)"
            },
            new CityLocation
            {
                Id = "ant",
                Title = "Antalya",
                Lat = 36.8969,
                Lng = 30.7133,
                Population = 2688004,
                Value = 2688004,
                Unit = "Kişi",
                Color = "#f59e0b",
                Category = "Turizm",
                Address = "Kaleiçi & Konyaaltı, Antalya",
                Phone = "+90 (242) 555-0500",
                Rating = 4.9,
                ImageUrl = "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&q=80",
                Tooltip = "Akdeniz'in turizm ve tarım başkenti (2.6M Nüfus)"
            },
            new CityLocation
            {
                Id = "adn",
                Title = "Adana",
                Lat = 37.0000,
                Lng = 35.3213,
                Population = 2274106,
                Value = 2274106,
                Unit = "Kişi",
                Color = "#ec4899",
                Category = "Çukurova Tarım",
                Address = "Seyhan & Çukurova, Adana",
                Phone = "+90 (322) 555-0600",
                Rating = 4.6,
                ImageUrl = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&q=80",
                Tooltip = "Çukurova tarım ve sanayi havzası (2.2M Nüfus)"
            },
            new CityLocation
            {
                Id = "kon",
                Title = "Konya",
                Lat = 37.8746,
                Lng = 32.4932,
                Population = 2296347,
                Value = 2296347,
                Unit = "Kişi",
                Color = "#8b5cf6",
                Category = "Tahıl & Sanayi",
                Address = "Selçuklu, Konya",
                Phone = "+90 (332) 555-0700",
                Rating = 4.7,
                ImageUrl = "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80",
                Tooltip = "Türkiye'nin tahıl ambarı ve makine sanayisi (2.2M Nüfus)"
            },
            new CityLocation
            {
                Id = "gaz",
                Title = "Gaziantep",
                Lat = 37.0662,
                Lng = 37.3833,
                Population = 2154051,
                Value = 2154051,
                Unit = "Kişi",
                Color = "#f97316",
                Category = "Gastronomi & İhracat",
                Address = "Şehitkamil OSB, Gaziantep",
                Phone = "+90 (342) 555-0800",
                Rating = 4.8,
                ImageUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=80",
                Tooltip = "Güneydoğu sanayi devi ve UNESCO gastronomi şehri (2.1M Nüfus)"
            },
            new CityLocation
            {
                Id = "tra",
                Title = "Trabzon",
                Lat = 41.0027,
                Lng = 39.7168,
                Population = 824352,
                Value = 824352,
                Unit = "Kişi",
                Color = "#059669",
                Category = "Karadeniz Ticaret",
                Address = "Ortahisar Limanı, Trabzon",
                Phone = "+90 (462) 555-0900",
                Rating = 4.8,
                ImageUrl = "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=300&q=80",
                Tooltip = "Doğu Karadeniz ticaret ve lojistik üssü (824K Nüfus)"
            }
        };
    }

    public static List<CityLocation> GetRetailStores()
    {
        return new List<CityLocation>
        {
            new CityLocation
            {
                Id = "st-ist-1",
                Title = "Panoptes Maslak Flagship Store",
                Lat = 41.1118,
                Lng = 29.0205,
                Address = "Büyükdere Cad. No: 185 Maslak, İstanbul",
                Phone = "+90 212 999 1010",
                Category = "Flagship Mağaza",
                Rating = 4.9,
                Color = "#4f46e5",
                Tooltip = "Maslak Açık Mağaza: 10:00 - 22:00"
            },
            new CityLocation
            {
                Id = "st-ist-2",
                Title = "Panoptes Kadıköy Mağazası",
                Lat = 40.9902,
                Lng = 29.0298,
                Address = "Bağdat Caddesi No: 342 Kadıköy, İstanbul",
                Phone = "+90 216 999 1020",
                Category = "Konsept Mağaza",
                Rating = 4.8,
                Color = "#06b6d4",
                Tooltip = "Kadıköy Bağdat Cad. Mağazası"
            },
            new CityLocation
            {
                Id = "st-ank-1",
                Title = "Panoptes Ankara Armada",
                Lat = 39.9132,
                Lng = 32.8085,
                Address = "Eskişehir Yolu Armada AVM Kat: 1, Ankara",
                Phone = "+90 312 999 2010",
                Category = "AVM Mağaza",
                Rating = 4.7,
                Color = "#ef4444",
                Tooltip = "Ankara Armada AVM: 10:00 - 22:00"
            },
            new CityLocation
            {
                Id = "st-izm-1",
                Title = "Panoptes İzmir Alsancak",
                Lat = 38.4362,
                Lng = 27.1422,
                Address = "Gül Sokak No: 18 Alsancak, İzmir",
                Phone = "+90 232 999 3010",
                Category = "Cadde Mağaza",
                Rating = 4.9,
                Color = "#10b981",
                Tooltip = "İzmir Alsancak Mağazası"
            },
            new CityLocation
            {
                Id = "st-ant-1",
                Title = "Panoptes Antalya Terracity",
                Lat = 36.8523,
                Lng = 30.7571,
                Address = "Fener Mah. Terracity AVM, Antalya",
                Phone = "+90 242 999 4010",
                Category = "AVM Mağaza",
                Rating = 4.8,
                Color = "#f59e0b",
                Tooltip = "Antalya Terracity: 10:00 - 22:00"
            }
        };
    }

    /// <summary>
    /// Türkiye Coğrafi Bölgeleri için GeoJSON FeatureCollection
    /// </summary>
    public static object GetTurkeyRegionsGeoJson()
    {
        return new
        {
            type = "FeatureCollection",
            features = new object[]
            {
                new
                {
                    type = "Feature",
                    properties = new
                    {
                        id = "marmara",
                        name = "Marmara Bölgesi",
                        gdpShare = "%31.2",
                        population = "25.4 Milyon",
                        score = 95,
                        fillColor = "#4338ca",
                        strokeColor = "#312e81",
                        fillOpacity = 0.55
                    },
                    geometry = new
                    {
                        type = "Polygon",
                        coordinates = new double[][][]
                        {
                            new double[][]
                            {
                                new double[] { 26.0, 40.0 },
                                new double[] { 26.0, 42.0 },
                                new double[] { 29.5, 42.0 },
                                new double[] { 30.5, 41.2 },
                                new double[] { 30.0, 40.0 },
                                new double[] { 28.0, 39.8 },
                                new double[] { 26.0, 40.0 }
                            }
                        }
                    }
                },
                new
                {
                    type = "Feature",
                    properties = new
                    {
                        id = "ege",
                        name = "Ege Bölgesi",
                        gdpShare = "%16.4",
                        population = "10.5 Milyon",
                        score = 82,
                        fillColor = "#0284c7",
                        strokeColor = "#0369a1",
                        fillOpacity = 0.55
                    },
                    geometry = new
                    {
                        type = "Polygon",
                        coordinates = new double[][][]
                        {
                            new double[][]
                            {
                                new double[] { 26.2, 36.6 },
                                new double[] { 26.2, 39.8 },
                                new double[] { 28.5, 39.5 },
                                new double[] { 30.0, 38.0 },
                                new double[] { 29.5, 36.8 },
                                new double[] { 27.5, 36.6 },
                                new double[] { 26.2, 36.6 }
                            }
                        }
                    }
                },
                new
                {
                    type = "Feature",
                    properties = new
                    {
                        id = "ic_anadolu",
                        name = "İç Anadolu Bölgesi",
                        gdpShare = "%18.1",
                        population = "12.9 Milyon",
                        score = 78,
                        fillColor = "#0d9488",
                        strokeColor = "#0f766e",
                        fillOpacity = 0.55
                    },
                    geometry = new
                    {
                        type = "Polygon",
                        coordinates = new double[][][]
                        {
                            new double[][]
                            {
                                new double[] { 30.0, 38.0 },
                                new double[] { 30.0, 40.0 },
                                new double[] { 35.5, 40.5 },
                                new double[] { 37.0, 39.5 },
                                new double[] { 36.0, 37.8 },
                                new double[] { 32.5, 37.5 },
                                new double[] { 30.0, 38.0 }
                            }
                        }
                    }
                },
                new
                {
                    type = "Feature",
                    properties = new
                    {
                        id = "akdeniz",
                        name = "Akdeniz Bölgesi",
                        gdpShare = "%13.2",
                        population = "10.8 Milyon",
                        score = 74,
                        fillColor = "#d97706",
                        strokeColor = "#b45309",
                        fillOpacity = 0.55
                    },
                    geometry = new
                    {
                        type = "Polygon",
                        coordinates = new double[][][]
                        {
                            new double[][]
                            {
                                new double[] { 29.5, 36.2 },
                                new double[] { 32.5, 37.5 },
                                new double[] { 36.5, 37.5 },
                                new double[] { 36.5, 35.8 },
                                new double[] { 33.5, 36.0 },
                                new double[] { 30.5, 36.2 },
                                new double[] { 29.5, 36.2 }
                            }
                        }
                    }
                },
                new
                {
                    type = "Feature",
                    properties = new
                    {
                        id = "karadeniz",
                        name = "Karadeniz Bölgesi",
                        gdpShare = "%8.8",
                        population = "7.6 Milyon",
                        score = 65,
                        fillColor = "#16a34a",
                        strokeColor = "#15803d",
                        fillOpacity = 0.55
                    },
                    geometry = new
                    {
                        type = "Polygon",
                        coordinates = new double[][][]
                        {
                            new double[][]
                            {
                                new double[] { 30.5, 41.2 },
                                new double[] { 35.5, 42.0 },
                                new double[] { 41.5, 41.5 },
                                new double[] { 41.0, 40.2 },
                                new double[] { 35.5, 40.5 },
                                new double[] { 30.5, 40.5 },
                                new double[] { 30.5, 41.2 }
                            }
                        }
                    }
                },
                new
                {
                    type = "Feature",
                    properties = new
                    {
                        id = "dogu_anadolu",
                        name = "Doğu Anadolu Bölgesi",
                        gdpShare = "%5.5",
                        population = "6.1 Milyon",
                        score = 54,
                        fillColor = "#ea580c",
                        strokeColor = "#c2410c",
                        fillOpacity = 0.55
                    },
                    geometry = new
                    {
                        type = "Polygon",
                        coordinates = new double[][][]
                        {
                            new double[][]
                            {
                                new double[] { 37.0, 39.5 },
                                new double[] { 41.0, 40.2 },
                                new double[] { 44.5, 39.8 },
                                new double[] { 44.5, 37.5 },
                                new double[] { 41.5, 38.0 },
                                new double[] { 38.0, 38.5 },
                                new double[] { 37.0, 39.5 }
                            }
                        }
                    }
                },
                new
                {
                    type = "Feature",
                    properties = new
                    {
                        id = "guneydogu_anadolu",
                        name = "Güneydoğu Anadolu Bölgesi",
                        gdpShare = "%6.8",
                        population = "9.4 Milyon",
                        score = 60,
                        fillColor = "#e11d48",
                        strokeColor = "#be123c",
                        fillOpacity = 0.55
                    },
                    geometry = new
                    {
                        type = "Polygon",
                        coordinates = new double[][][]
                        {
                            new double[][]
                            {
                                new double[] { 36.5, 37.5 },
                                new double[] { 41.5, 38.0 },
                                new double[] { 42.5, 37.2 },
                                new double[] { 37.0, 36.7 },
                                new double[] { 36.5, 37.5 }
                            }
                        }
                    }
                }
            }
        };
    }
}
