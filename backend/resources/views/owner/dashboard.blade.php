<!DOCTYPE html>
<html>
<head>
    <title>Owner Dashboard</title>
</head>
<body>
    <h1>Welcome, {{ auth()->guard('gym_owner')->user()->full_name ?? 'Owner' }}</h1>

    @if(session('success'))
        <div style="color:green; margin-bottom:15px;">
            {{ session('success') }}
        </div>
    @endif

    <h2>My Gyms</h2>

    @forelse($gyms as $gym)
        <div style="border:1px solid black; padding:10px; margin-bottom:15px;">
            <strong>Gym ID:</strong> {{ $gym->gym_id }} <br>
            <strong>Gym Owner ID:</strong> {{ $gym->owner_id }} <br>
            <strong>Logged-in Owner ID:</strong> {{ auth()->guard('gym_owner')->user()->owner_id ?? 'NONE' }} <br>
        </div>

        <form method="POST" action="/owner/gyms/{{ $gym->gym_id }}">
            @csrf
            @method('PUT')

            <label>Gym Name</label><br>
            <input type="text" name="name" value="{{ $gym->name }}"><br><br>

            <label>Description</label><br>
            <textarea name="description">{{ $gym->description }}</textarea><br><br>

            <label>Address</label><br>
            <input type="text" name="address" value="{{ $gym->address }}"><br><br>

            <label>Monthly Price</label><br>
            <input type="number" name="monthly_price" value="{{ $gym->monthly_price }}" step="0.01"><br><br>

            {{-- Checkbox fields --}}
            <input type="hidden" name="has_personal_trainers" value="0">
            <label>
                <input type="checkbox" name="has_personal_trainers" value="1" {{ $gym->has_personal_trainers ? 'checked' : '' }}>
                Has Personal Trainers
            </label><br>

            <input type="hidden" name="has_classes" value="0">
            <label>
                <input type="checkbox" name="has_classes" value="1" {{ $gym->has_classes ? 'checked' : '' }}>
                Has Classes
            </label><br>

            <input type="hidden" name="is_24_hours" value="0">
            <label>
                <input type="checkbox" name="is_24_hours" value="1" {{ $gym->is_24_hours ? 'checked' : '' }}>
                Open 24 Hours
            </label><br>

            <input type="hidden" name="is_airconditioned" value="0">
            <label>
                <input type="checkbox" name="is_airconditioned" value="1" {{ $gym->is_airconditioned ? 'checked' : '' }}>
                Airconditioned
            </label><br><br>

            <button type="submit">Update Gym</button>
        </form>

        <hr>
    @empty
        <p>You have no gyms yet.</p>
    @endforelse

    <form method="POST" action="/gym-owner/logout" style="margin-top:20px;">
        @csrf
        <button type="submit">Logout</button>
    </form>
</body>
</html>
