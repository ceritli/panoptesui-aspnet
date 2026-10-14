using System.Collections.Generic;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Controllers;

public static class DropDownTreeDemoData
{
    public static List<DropDownTreeItemModel> GetOrganizationTree()
    {
        return new List<DropDownTreeItemModel>
        {
            new DropDownTreeItemModel
            {
                Id = "dept_tech",
                Value = "tech",
                Text = "AR-GE ve Bilgi Teknolojileri",
                Icon = "folder",
                Expanded = true,
                Badge = "Merkez",
                BadgeColor = "blue",
                Children = new List<DropDownTreeItemModel>
                {
                    new DropDownTreeItemModel
                    {
                        Id = "team_software",
                        Value = "software",
                        Text = "Yazılım Geliştirme",
                        Icon = "code",
                        Expanded = true,
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Backend Ekibi (.NET)", "backend", "code") { Badge = "4 Kişi", BadgeColor = "emerald" },
                            new DropDownTreeItemModel("Frontend Ekibi (JS / CSS)", "frontend", "code") { Badge = "3 Kişi", BadgeColor = "purple" },
                            new DropDownTreeItemModel("Mobil Ekip (iOS / Android)", "mobile", "code")
                        }
                    },
                    new DropDownTreeItemModel
                    {
                        Id = "team_cloud",
                        Value = "cloud",
                        Text = "DevOps ve Bulut Mimarisi",
                        Icon = "chart",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Kubernetes ve CI/CD", "k8s", "code"),
                            new DropDownTreeItemModel("Siber Güvenlik & SOC", "security", "file") { Badge = "Kritik", BadgeColor = "rose" }
                        }
                    },
                    new DropDownTreeItemModel
                    {
                        Id = "team_ai",
                        Value = "ai",
                        Text = "Yapay Zeka & Veri Bilimi",
                        Icon = "chart",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Makine Öğrenimi (MLOps)", "ml", "chart"),
                            new DropDownTreeItemModel("Büyük Veri & BI Analitik", "bi", "chart")
                        }
                    }
                }
            },
            new DropDownTreeItemModel
            {
                Id = "dept_operations",
                Value = "ops",
                Text = "Operasyon & İş Geliştirme",
                Icon = "folder",
                Expanded = false,
                Children = new List<DropDownTreeItemModel>
                {
                    new DropDownTreeItemModel
                    {
                        Id = "team_sales",
                        Value = "sales",
                        Text = "Satış ve Müşteri İlişkileri",
                        Icon = "user",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Kurumsal Satış (B2B)", "b2b", "user"),
                            new DropDownTreeItemModel("Bireysel Satış (B2C)", "b2c", "user")
                        }
                    },
                    new DropDownTreeItemModel
                    {
                        Id = "team_finance",
                        Value = "finance",
                        Text = "Finans & Muhasebe",
                        Icon = "file",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Bütçe ve Raporlama", "budget", "file"),
                            new DropDownTreeItemModel("Mali Müşavirlik", "accounting", "file")
                        }
                    }
                }
            },
            new DropDownTreeItemModel
            {
                Id = "dept_hr",
                Value = "hr",
                Text = "İnsan Kaynakları ve Akademi",
                Icon = "user",
                Expanded = false,
                Children = new List<DropDownTreeItemModel>
                {
                    new DropDownTreeItemModel("Yetenek Kazanımı & İşe Alım", "talent", "user"),
                    new DropDownTreeItemModel("Eğitim ve Sertifikasyon", "training", "file")
                }
            }
        };
    }

    public static List<DropDownTreeItemModel> GetCategoriesTree()
    {
        return new List<DropDownTreeItemModel>
        {
            new DropDownTreeItemModel
            {
                Id = "cat_elec",
                Value = "elec",
                Text = "Elektronik & Bilgisayar",
                Icon = "folder",
                Expanded = true,
                Children = new List<DropDownTreeItemModel>
                {
                    new DropDownTreeItemModel
                    {
                        Id = "cat_comp",
                        Value = "computers",
                        Text = "Bilgisayar & Çevre Birimleri",
                        Icon = "folder",
                        Expanded = true,
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Dizüstü Bilgisayarlar (Laptop)", "laptop", "code") { Badge = "Yeni", BadgeColor = "emerald" },
                            new DropDownTreeItemModel("Masaüstü Oyuncu Bilgisayarı", "desktop", "code"),
                            new DropDownTreeItemModel("Monitör & Ekranlar", "monitors", "image")
                        }
                    },
                    new DropDownTreeItemModel
                    {
                        Id = "cat_phone",
                        Value = "phones",
                        Text = "Akıllı Telefonlar & Tabletler",
                        Icon = "folder",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("iOS Akıllı Telefonlar", "iphone", "file"),
                            new DropDownTreeItemModel("Android Akıllı Telefonlar", "android", "file"),
                            new DropDownTreeItemModel("Tablet Bilgisayarlar", "tablets", "file")
                        }
                    }
                }
            },
            new DropDownTreeItemModel
            {
                Id = "cat_fashion",
                Value = "fashion",
                Text = "Moda & Giyim",
                Icon = "folder",
                Children = new List<DropDownTreeItemModel>
                {
                    new DropDownTreeItemModel
                    {
                        Id = "cat_men",
                        Value = "men",
                        Text = "Erkek Giyim",
                        Icon = "user",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Ceket & Takım Elbise", "suits", "file"),
                            new DropDownTreeItemModel("Gömlek & Tişört", "shirts", "file")
                        }
                    },
                    new DropDownTreeItemModel
                    {
                        Id = "cat_women",
                        Value = "women",
                        Text = "Kadın Giyim",
                        Icon = "user",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Elbise & Etek", "dresses", "file"),
                            new DropDownTreeItemModel("Ayakkabı & Çanta", "shoes", "file")
                        }
                    }
                }
            },
            new DropDownTreeItemModel
            {
                Id = "cat_home",
                Value = "home",
                Text = "Ev & Yaşam / Mobilya",
                Icon = "folder",
                Children = new List<DropDownTreeItemModel>
                {
                    new DropDownTreeItemModel("Çalışma Masası & Sandalye", "furniture", "file"),
                    new DropDownTreeItemModel("Aydınlatma & Lamba", "lighting", "file")
                }
            }
        };
    }

    public static List<DropDownTreeItemModel> GetLocationsTree()
    {
        return new List<DropDownTreeItemModel>
        {
            new DropDownTreeItemModel
            {
                Id = "loc_tr",
                Value = "tr",
                Text = "Türkiye",
                Icon = "folder",
                Expanded = true,
                Children = new List<DropDownTreeItemModel>
                {
                    new DropDownTreeItemModel
                    {
                        Id = "loc_marmara",
                        Value = "marmara",
                        Text = "Marmara Bölgesi",
                        Icon = "folder",
                        Expanded = true,
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("İstanbul (Avrupa & Anadolu)", "istanbul", "file") { Badge = "Merkez Ofis", BadgeColor = "blue" },
                            new DropDownTreeItemModel("Bursa (Nilüfer Ar-Ge)", "bursa", "file"),
                            new DropDownTreeItemModel("Kocaeli (Gebze Bilişim Vadisi)", "kocaeli", "file")
                        }
                    },
                    new DropDownTreeItemModel
                    {
                        Id = "loc_central",
                        Value = "central",
                        Text = "İç Anadolu Bölgesi",
                        Icon = "folder",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("Ankara (Teknokent Kampüsü)", "ankara", "file") { Badge = "Kamu İrtibat", BadgeColor = "amber" },
                            new DropDownTreeItemModel("Eskişehir (Yazılım Köyü)", "eskisehir", "file")
                        }
                    },
                    new DropDownTreeItemModel
                    {
                        Id = "loc_aegean",
                        Value = "aegean",
                        Text = "Ege Bölgesi",
                        Icon = "folder",
                        Children = new List<DropDownTreeItemModel>
                        {
                            new DropDownTreeItemModel("İzmir (Urla İYTE Teknopark)", "izmir", "file"),
                            new DropDownTreeItemModel("Muğla (Bodrum Ofis)", "mugla", "file")
                        }
                    }
                }
            }
        };
    }
}
