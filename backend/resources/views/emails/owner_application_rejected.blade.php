<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif;">
    <h2>Rejected ❌</h2>
    <p>Hi {{ $name }},</p>
    <p>Your gym owner application has been <b>rejected</b>.</p>

    @if(!empty($reason))
      <p><b>Reason:</b> {{ $reason }}</p>
    @endif

    <p>You may apply again after updating your details.</p>
    <p>— ExerSearch Team</p>
  </body>
</html>