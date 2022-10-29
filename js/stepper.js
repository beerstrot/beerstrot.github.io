$(document).ready(function() {

        // ------------ Counter BEGIN ------------
        $(".counter__increment, .counter__decrement").click(function(e)
        {
            var $this = $(this);
            var $counter__input = $(this).find(".counter__input");
            var $currentVal = parseInt($(this).parent().find(".counter__input").val());

            //Increment
            if ($currentVal != NaN && $this.hasClass('counter__increment'))
            {
                $counter__input.val($currentVal + 1);
            }
            //Decrement
            else if ($currentVal != NaN && $this.hasClass('counter__decrement'))
            {
                if ($currentVal >= 1) {
                    $counter__input.val($currentVal - 1);
                }
            }
        });
        // ------------ Counter END ------------

    });