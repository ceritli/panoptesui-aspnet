using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Channels;
using Panoptes.AspNetCore.Models;

namespace Panoptes.AspNetCore.Demo.Data;

/// <summary>
/// Takvim demoları için bellek içi etkinlik deposu. Her "set" ayrı bir koleksiyondur;
/// değişiklikler Server-Sent Events aboneliği olan istemcilere anında yayınlanır.
/// </summary>
public static class SchedulerDemoStore
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly ConcurrentDictionary<string, SetState> Sets = new(StringComparer.OrdinalIgnoreCase);

    private static readonly Dictionary<string, Func<List<SchedulerEventModel>>> Seeds = new(StringComparer.OrdinalIgnoreCase)
    {
        ["tasks"] = SchedulerDemoData.Tasks,
        ["webapi"] = SchedulerDemoData.Tasks,
        ["meetings"] = SchedulerDemoData.Meetings,
        ["realtime"] = SchedulerDemoData.Meetings,
        ["utc"] = SchedulerDemoData.UtcTasks
    };

    public static bool Exists(string set) => Seeds.ContainsKey(set);

    private sealed class SetState
    {
        public readonly object Gate = new();
        public List<SchedulerEventModel> Events = new();
        public readonly List<Channel<string>> Subscribers = new();
    }

    private static SetState Get(string set) => Sets.GetOrAdd(set, s => new SetState { Events = Seeds[s]() });

    public static List<SchedulerEventModel> Query(string set, DateTime? start, DateTime? end)
    {
        var st = Get(set);
        lock (st.Gate)
        {
            IEnumerable<SchedulerEventModel> q = st.Events;
            if (start.HasValue && end.HasValue)
            {
                var s = start.Value; var e = end.Value;
                q = q.Where(x => !string.IsNullOrEmpty(x.RecurrenceRule) || (x.IsAllDay ? x.Start.Date < e && x.End.Date.AddDays(1) > s : x.Start < e && x.End > s));
            }
            return q.ToList();
        }
    }

    public static SchedulerEventModel Create(string set, SchedulerEventModel ev)
    {
        var st = Get(set);
        ev.Id = Guid.NewGuid().ToString("N")[..10];
        lock (st.Gate) st.Events.Add(ev);
        Broadcast(st, "create", ev);
        return ev;
    }

    public static SchedulerEventModel? Update(string set, string id, SchedulerEventModel ev)
    {
        var st = Get(set);
        ev.Id = id;
        lock (st.Gate)
        {
            var i = st.Events.FindIndex(x => x.Id == id);
            if (i < 0) return null;
            st.Events[i] = ev;
        }
        Broadcast(st, "update", ev);
        return ev;
    }

    public static bool Delete(string set, string id)
    {
        var st = Get(set);
        SchedulerEventModel? removed;
        lock (st.Gate)
        {
            removed = st.Events.FirstOrDefault(x => x.Id == id);
            if (removed == null) return false;
            st.Events.Remove(removed);
        }
        Broadcast(st, "destroy", removed);
        return true;
    }

    public static void Reset(string set)
    {
        var st = Get(set);
        lock (st.Gate) st.Events = Seeds[set]();
        Broadcast(st, "reset", null);
    }

    public static ChannelReader<string> Subscribe(string set, out Action unsubscribe)
    {
        var st = Get(set);
        var ch = Channel.CreateBounded<string>(new BoundedChannelOptions(100) { FullMode = BoundedChannelFullMode.DropOldest });
        lock (st.Gate) st.Subscribers.Add(ch);
        unsubscribe = () => { lock (st.Gate) st.Subscribers.Remove(ch); ch.Writer.TryComplete(); };
        return ch.Reader;
    }

    private static void Broadcast(SetState st, string action, SchedulerEventModel? ev)
    {
        var msg = JsonSerializer.Serialize(new { action, @event = ev }, Json);
        Channel<string>[] subs;
        lock (st.Gate) subs = st.Subscribers.ToArray();
        foreach (var s in subs) s.Writer.TryWrite(msg);
    }
}
